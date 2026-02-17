export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = "admin" | "teacher" | "student";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: Role;
          created_at: string;
          must_change_password: boolean;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role: Role;
          created_at?: string;
          must_change_password?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: Role;
          created_at?: string;
          must_change_password?: boolean;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
        Relationships: [];
      };
      class_students: {
        Row: {
          class_id: string;
          user_id: string;
        };
        Insert: { class_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["class_students"]["Insert"]>;
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          exam_name: string;
          note: number;
          date: string;
          coefficient: number | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          exam_name: string;
          note: number;
          date: string;
          coefficient?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["grades"]["Insert"]>;
        Relationships: [];
      };
      corrections: {
        Row: {
          id: string;
          title: string;
          class_id: string | null;
          file_path: string;
          file_name: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          class_id?: string | null;
          file_path: string;
          file_name: string;
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["corrections"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}
