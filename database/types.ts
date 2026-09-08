export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface UserRow {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
  role: string;
}

export interface SessionRow {
  id: string;
  expires_at: string;
  token: string;
  created_at: string;
  updated_at: string;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string;
}

export interface AccountRow {
  id: string;
  account_id: string;
  provider_id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  id_token: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  scope: string | null;
  password: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationRow {
  id: string;
  identifier: string;
  value: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface BranchRow {
  id: string;
  name: string;
  address: string;
  lat: string | null;
  lng: string | null;
  phone: string | null;
  opening_time: string | null;
  closing_time: string | null;
  status: string;
  ownership_type: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FranchiseBranchRow {
  id: string;
  user_id: string;
  branch_id: string;
  commission_rate: string;
  created_at: string;
}

export interface ChatChannelRow {
  id: string;
  type: string;
  branch_id: string | null;
  name: string | null;
  created_at: string;
}

export interface ChatChannelMemberRow {
  id: string;
  channel_id: string;
  user_id: string;
}

export interface ChatMessageRow {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  segment: string;
  loyalty_points: number;
  loyalty_tier: string;
  user_id: string | null;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  branch_id: string;
  customer_id: string | null;
  order_id: string | null;
  rating: number;
  comment: string | null;
  status: string;
  reply: string | null;
  created_at: string;
}

export interface EmployeeDetailsRow {
  id: string;
  user_id: string;
  branch_id: string;
  base_salary: string;
  hire_date: string;
  created_at: string;
}

export interface PayrollRow {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  amount: string;
  status: string;
  created_at: string;
}

export interface PayoutRow {
  id: string;
  franchise_owner_id: string;
  branch_id: string;
  amount: string;
  period_start: string;
  period_end: string;
  status: string;
  approved_by: string | null;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  order_id: string;
  branch_id: string;
  payment_method: string;
  amount: string;
  status: string;
  created_at: string;
}

export interface MenuCategoryRow {
  id: string;
  name: string;
  display_order: number;
}

export interface MenuItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  variants: Json | null;
  image_url: string | null;
  is_available: boolean;
}

export interface OrderRow {
  id: string;
  branch_id: string;
  customer_id: string | null;
  order_number: string;
  status: string;
  total_amount: string;
  created_by: string | null;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  price_snapshot: string;
  variant_snapshot: string | null;
  qty: number;
  subtotal: string;
}

export interface DailySetoranRow {
  id: string;
  branch_id: string;
  cashier_id: string;
  amount: string;
  date: string;
  status: string;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  branch_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Pembungkus tabel. Row/Insert/Update ditulis sebagai mapped type (bukan
 * interface langsung) supaya memenuhi constraint GenericTable supabase-js
 */
type Table<T> = {
  Row: { [K in keyof T]: T[K] };
  Insert: { [K in keyof T]?: T[K] };
  Update: { [K in keyof T]?: T[K] };
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      user: Table<UserRow>;
      session: Table<SessionRow>;
      account: Table<AccountRow>;
      verification: Table<VerificationRow>;
      branches: Table<BranchRow>;
      franchise_branches: Table<FranchiseBranchRow>;
      chat_channels: Table<ChatChannelRow>;
      chat_channel_members: Table<ChatChannelMemberRow>;
      chat_messages: Table<ChatMessageRow>;
      customers: Table<CustomerRow>;
      reviews: Table<ReviewRow>;
      employee_details: Table<EmployeeDetailsRow>;
      payrolls: Table<PayrollRow>;
      payouts: Table<PayoutRow>;
      transactions: Table<TransactionRow>;
      menu_categories: Table<MenuCategoryRow>;
      menu_items: Table<MenuItemRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      daily_setorans: Table<DailySetoranRow>;
      audit_logs: Table<AuditLogRow>;
      notifications: Table<NotificationRow>;
    };
    Views: Record<string, never>;
    Functions: {
      get_overview_dashboard: {
        Args: {
          p_branch_id: string | null;
          p_branch_ids: string[] | null;
          p_start_date: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
