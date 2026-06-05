// Generirane TypeScript types za Supabase shemo.
// Ko bo shema ustvarjena, zamenjaj z: npx supabase gen types typescript --linked

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          currency: string;
          country: string;
          tax_scale: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["households"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["households"]["Insert"]>;
      };
      user_profiles: {
        Row: { id: string; household_id: string; created_at: string };
        Insert: { id: string; household_id: string };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      members: {
        Row: {
          id: string; household_id: string; name: string; initials: string;
          type: "adult" | "child" | "pet"; birth_date: string | null;
          color: string | null; is_admin: boolean; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["members"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
      };
      categories: {
        Row: { code: string; name: string; type: string; parent_code: string | null; icon: string | null };
        Insert: Database["public"]["Tables"]["categories"]["Row"];
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string; household_id: string; date: string; description: string;
          amount: number; type: "income" | "expense"; category_code: string;
          member_id: string | null; document_id: string | null; notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      budget_items: {
        Row: { id: string; household_id: string; category_code: string; monthly_limit: number };
        Insert: Omit<Database["public"]["Tables"]["budget_items"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["budget_items"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string; household_id: string; name: string; uploaded_at: string;
          document_date: string | null; type: string; status: string;
          file_path: string | null; ocr_amount: number | null;
          ocr_suggested_category: string | null; ocr_raw_text: string | null;
          linked_transaction_id: string | null; expiry_date: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "uploaded_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      events: {
        Row: {
          id: string; household_id: string; title: string; date: string;
          type: string; member_id: string | null; notes: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_household_id: { Args: Record<string, never>; Returns: string };
    };
  };
}
