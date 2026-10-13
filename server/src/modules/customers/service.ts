import type { CurrentUser } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { checkRate, logAudit } from "../../utils/effects.js";
import { normalizePhone, tierForPoints } from "../../utils/loyalty.js";
import type {
	createCustomerBody,
	getCustomersQuery,
	updateCustomerBody,
} from "./model.js";
import { customerRepo, type NewCustomer } from "./repository.js";

export const getCustomers = async (params: typeof getCustomersQuery.static) => {
	const { page, pageSize, sortDir } = resolveTableParams(params);

	const result = await customerRepo.list({
		segment: params.segment,
		tier: params.tier,
		q: params.q,
		sortBy: params.sortBy,
		sortDir,
		page,
		pageSize,
	});

	return ok({
		...pageResult(
			result.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			result.total,
			page,
			pageSize,
		),
		summary: {
			total: result.total,
			totalOrders: result.orderTotal,
			totalPoints: Number(result.pointsTotal ?? 0),
		},
	});
};

export const getCustomerDetail = async (id: string) => {
	const row = await customerRepo.findDetail(id);
	if (!row) return fail(404, "Customer not found");

	return ok({ ...row, createdAt: row.createdAt.toISOString() });
};

export const createCustomer = async (
	user: CurrentUser,
	data: typeof createCustomerBody.static,
) => {
	const limited = checkRate(`customers:create:${user.id}`, 20, 60_000);
	if (limited) return limited;

	const payload: NewCustomer = {
		fullName: data.fullName,
		email: data.email || null,
		phone: data.phone || null,
		segment: data.segment ?? "regular",
	};
	const customer = await customerRepo.create(payload);
	if (!customer) return fail(500, "Failed to create customer");

	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "customers",
		targetId: customer.id,
		metadata: { fullName: customer.fullName },
	});

	return ok(customer);
};

export const lookupCustomerByPhone = async (user: CurrentUser, phone: string) => {
	const limited = checkRate(`customers:lookup:${user.id}`, 30, 60_000);
	if (limited) return limited;

	const digits = normalizePhone(phone);
	if (digits === "") return ok(null);

	const customer = await customerRepo.findLoyaltyCard(digits);

	return ok(customer ?? null);
};

export const findOrCreateCustomer = async (
	user: CurrentUser,
	fullName: string,
	phone?: string,
) => {
	const limited = checkRate(`customers:find-or-create:${user.id}`, 20, 60_000);
	if (limited) return limited;

	const digits = phone ? normalizePhone(phone) : "";
	if (digits !== "") {
		const byPhone = await customerRepo.findByPhone(digits);
		if (byPhone) return ok(byPhone);
	}

	const existing = await customerRepo.findByName(fullName);
	if (existing) return ok(existing);

	try {
		const customer = await customerRepo.create({
			fullName,
			phone: digits !== "" ? digits : null,
		});
		if (!customer) return fail(500, "Failed to create customer");
		void logAudit({
			actorId: user.id,
			action: "create",
			targetTable: "customers",
			targetId: customer.id,
			metadata: { fullName },
		});
		return ok(customer);
	} catch {
		const fallback = await customerRepo.findByName(fullName);
		if (!fallback) return fail(500, "Failed to create customer");
		return ok(fallback);
	}
};

export const updateCustomer = async (
	user: CurrentUser,
	id: string,
	data: typeof updateCustomerBody.static,
) => {
	const limited = checkRate(`customers:update:${user.id}`, 30, 60_000);
	if (limited) return limited;

	const patch: Partial<NewCustomer> = { ...data };
	if (patch.email === "") patch.email = null;
	if (patch.phone === "") patch.phone = null;
	const customer = await customerRepo.update(id, patch);
	if (!customer) return fail(404, "Customer not found");

	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "customers",
		targetId: id,
		metadata: data,
	});

	return ok(customer);
};

export const deleteCustomer = async (user: CurrentUser, id: string) => {
	const limited = checkRate(`customers:delete:${user.id}`, 10, 60_000);
	if (limited) return limited;

	await customerRepo.remove(id);

	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "customers",
		targetId: id,
	});

	return ok(null);
};

export const updateLoyaltyPoints = async (
	user: CurrentUser,
	customerId: string,
	points: number,
) => {
	const limited = checkRate(`customers:loyalty:${user.id}`, 30, 60_000);
	if (limited) return limited;

	const customer = await customerRepo.setLoyalty(
		customerId,
		points,
		tierForPoints(points),
	);
	if (!customer) return fail(404, "Customer not found");

	return ok(customer);
};
