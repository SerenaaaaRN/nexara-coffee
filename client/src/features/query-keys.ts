export const branchKeys = {
    all: ["branches"] as const,
    lists: () => [...branchKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...branchKeys.lists(), filters] as const)
            : branchKeys.lists(),
    details: () => [...branchKeys.all, "detail"] as const,
    detail: (id: string) => [...branchKeys.details(), id] as const,
};

export const customerKeys = {
    all: ["customers"] as const,
    lists: () => [...customerKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...customerKeys.lists(), filters] as const)
            : customerKeys.lists(),
    details: () => [...customerKeys.all, "detail"] as const,
    detail: (id: string) => [...customerKeys.details(), id] as const,
    lookup: (phone: string) => [...customerKeys.all, "lookup", phone] as const,
};

export const employeeKeys = {
    all: ["employees"] as const,
    lists: () => [...employeeKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...employeeKeys.lists(), filters] as const)
            : employeeKeys.lists(),
    details: () => [...employeeKeys.all, "detail"] as const,
    detail: (id: string) => [...employeeKeys.details(), id] as const,
    availableUsers: () => [...employeeKeys.all, "available-users"] as const,
    branches: () => [...employeeKeys.all, "branches"] as const,
};

export const mapKeys = {
    all: ["maps"] as const,
    branches: () => [...mapKeys.all, "branches"] as const,
};

export const menuKeys = {
    all: ["menu"] as const,
    categories: () => [...menuKeys.all, "categories"] as const,
    items: (categoryId?: string | null) =>
        categoryId
            ? ([...menuKeys.all, "items", categoryId] as const)
            : ([...menuKeys.all, "items"] as const),
};

export const overviewKeys = {
    all: ["overview"] as const,
    dashboard: (branch?: string | null) =>
        branch
            ? ([...overviewKeys.all, "dashboard", branch] as const)
            : ([...overviewKeys.all, "dashboard"] as const),
};

export const reviewKeys = {
    all: ["reviews"] as const,
    lists: () => [...reviewKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...reviewKeys.lists(), filters] as const)
            : reviewKeys.lists(),
    details: () => [...reviewKeys.all, "detail"] as const,
    detail: (id: string) => [...reviewKeys.details(), id] as const,
};

export const transactionKeys = {
    all: ["transactions"] as const,
    lists: () => [...transactionKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...transactionKeys.lists(), filters] as const)
            : transactionKeys.lists(),
    details: () => [...transactionKeys.all, "detail"] as const,
    detail: (id: string) => [...transactionKeys.details(), id] as const,
};

export const payoutKeys = {
    all: ["payouts"] as const,
    lists: () => [...payoutKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...payoutKeys.lists(), filters] as const)
            : payoutKeys.lists(),
};

export const kasirKeys = {
    all: ["kasir"] as const,
    lists: () => [...kasirKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...kasirKeys.lists(), filters] as const)
            : kasirKeys.lists(),
    expectedCash: (branchId: string, date: string) =>
        [...kasirKeys.all, "expected-cash", branchId, date] as const,
};

export const orderKeys = {
    all: ["orders"] as const,
    lists: () => [...orderKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...orderKeys.lists(), filters] as const)
            : orderKeys.lists(),
    details: () => [...orderKeys.all, "detail"] as const,
    detail: (id: string) => [...orderKeys.details(), id] as const,
};

export const chatKeys = {
    all: ["chat"] as const,
    channels: () => [...chatKeys.all, "channels"] as const,
    messages: (channelId: string) =>
        [...chatKeys.all, "messages", channelId] as const,
    availableUsers: () => [...chatKeys.all, "availableUsers"] as const,
};

export const notificationKeys = {
    all: ["notifications"] as const,
    lists: () => [...notificationKeys.all, "list"] as const,
};

export const auditKeys = {
    all: ["audit"] as const,
    lists: () => [...auditKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters
            ? ([...auditKeys.lists(), filters] as const)
            : auditKeys.lists(),
};

export const userKeys = {
    all: ["users"] as const,
    lists: () => [...userKeys.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
        filters ? ([...userKeys.lists(), filters] as const) : userKeys.lists(),
};

export const landingKeys = {
    all: ["landing"] as const,
    branches: () => [...landingKeys.all, "branches"] as const,
    menu: () => [...landingKeys.all, "menu"] as const,
    reviews: () => [...landingKeys.all, "reviews"] as const,
};

export const myPortalKeys = {
    all: ["my"] as const,
    orders: () => [...myPortalKeys.all, "orders"] as const,
    loyalty: () => [...myPortalKeys.all, "loyalty"] as const,
};
