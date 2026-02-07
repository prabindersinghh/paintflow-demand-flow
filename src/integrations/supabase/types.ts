export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          region: string | null
          severity: string
          sku: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          region?: string | null
          severity: string
          sku?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          region?: string | null
          severity?: string
          sku?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          region: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region?: string
          type?: string
        }
        Relationships: []
      }
      dealers: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          region: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          region: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          region?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["warehouse__id"]
          },
          {
            foreignKeyName: "dealers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          confidence: number | null
          created_at: string
          forecast_date: string
          id: string
          predicted_demand: number
          product_id: string | null
          region: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          forecast_date: string
          id?: string
          predicted_demand: number
          product_id?: string | null
          region: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          forecast_date?: string
          id?: string
          predicted_demand?: number
          product_id?: string | null
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_sales: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          region: string
          sale_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          region: string
          sale_date: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          region?: string
          sale_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "historical_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "historical_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "historical_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          last_updated: string
          product_id: string
          quantity: number
          warehouse_id: string
        }
        Insert: {
          id?: string
          last_updated?: string
          product_id: string
          quantity?: number
          warehouse_id: string
        }
        Update: {
          id?: string
          last_updated?: string
          product_id?: string
          quantity?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["warehouse__id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          destination_warehouse_id: string | null
          id: string
          movement_type: string
          product_id: string
          quantity: number
          recommendation_id: string | null
          source_warehouse_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          destination_warehouse_id?: string | null
          id?: string
          movement_type: string
          product_id: string
          quantity: number
          recommendation_id?: string | null
          source_warehouse_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          destination_warehouse_id?: string | null
          id?: string
          movement_type?: string
          product_id?: string
          quantity?: number
          recommendation_id?: string | null
          source_warehouse_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["warehouse__id"]
          },
          {
            foreignKeyName: "inventory_movements_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["warehouse__id"]
          },
          {
            foreignKeyName: "inventory_movements_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_projection: {
        Row: {
          based_on_plan: boolean
          created_at: string
          current_quantity: number
          forecasted_demand: number
          id: string
          planned_inbound: number
          planned_outbound: number
          product_id: string
          projected_date: string
          projected_quantity: number
          warehouse_id: string
        }
        Insert: {
          based_on_plan?: boolean
          created_at?: string
          current_quantity?: number
          forecasted_demand?: number
          id?: string
          planned_inbound?: number
          planned_outbound?: number
          product_id: string
          projected_date: string
          projected_quantity?: number
          warehouse_id: string
        }
        Update: {
          based_on_plan?: boolean
          created_at?: string
          current_quantity?: number
          forecasted_demand?: number
          id?: string
          planned_inbound?: number
          planned_outbound?: number
          product_id?: string
          projected_date?: string
          projected_quantity?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_projection_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["warehouse__id"]
          },
          {
            foreignKeyName: "inventory_projection_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          dealer_id: string | null
          id: string
          product_id: string | null
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_actions: {
        Row: {
          action_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          executed_at: string | null
          from_location: string | null
          id: string
          planned_execution_date: string | null
          product_id: string | null
          quantity: number
          recommendation_id: string | null
          status: string
          to_location: string
        }
        Insert: {
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          executed_at?: string | null
          from_location?: string | null
          id?: string
          planned_execution_date?: string | null
          product_id?: string | null
          quantity: number
          recommendation_id?: string | null
          status?: string
          to_location: string
        }
        Update: {
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          executed_at?: string | null
          from_location?: string | null
          id?: string
          planned_execution_date?: string | null
          product_id?: string | null
          quantity?: number
          recommendation_id?: string | null
          status?: string
          to_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "planned_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "planned_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_actions_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          color: string | null
          created_at: string
          id: string
          min_stock: number
          name: string
          pack_size_litres: number
          sku: string
          unit_price: number
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          pack_size_litres?: number
          sku: string
          unit_price?: number
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          pack_size_litres?: number
          sku?: string
          unit_price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          region: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          region?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          region?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          ai_confidence: number | null
          created_at: string
          executed_at: string | null
          from_location: string | null
          id: string
          priority: string
          product_id: string | null
          quantity: number
          reason: string | null
          status: string
          to_location: string
          type: string
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string
          executed_at?: string | null
          from_location?: string | null
          id?: string
          priority?: string
          product_id?: string | null
          quantity: number
          reason?: string | null
          status?: string
          to_location: string
          type: string
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string
          executed_at?: string | null
          from_location?: string | null
          id?: string
          priority?: string
          product_id?: string | null
          quantity?: number
          reason?: string | null
          status?: string
          to_location?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      virtual_inventory_movements: {
        Row: {
          created_at: string
          from_warehouse: string | null
          id: string
          movement_type: string
          quantity_l: number
          simulated_date: string
          sku_id: string
          to_warehouse: string | null
        }
        Insert: {
          created_at?: string
          from_warehouse?: string | null
          id?: string
          movement_type: string
          quantity_l?: number
          simulated_date?: string
          sku_id: string
          to_warehouse?: string | null
        }
        Update: {
          created_at?: string
          from_warehouse?: string | null
          id?: string
          movement_type?: string
          quantity_l?: number
          simulated_date?: string
          sku_id?: string
          to_warehouse?: string | null
        }
        Relationships: []
      }
      virtual_inventory_projection: {
        Row: {
          current_stock_l: number
          id: string
          incoming_l: number
          outgoing_l: number
          projected_stock_l: number
          simulation_run_at: string
          sku_id: string
          warehouse_id: string
        }
        Insert: {
          current_stock_l?: number
          id?: string
          incoming_l?: number
          outgoing_l?: number
          projected_stock_l?: number
          simulation_run_at?: string
          sku_id: string
          warehouse_id: string
        }
        Update: {
          current_stock_l?: number
          id?: string
          incoming_l?: number
          outgoing_l?: number
          projected_stock_l?: number
          simulation_run_at?: string
          sku_id?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          capacity: number
          company_id: string | null
          created_at: string
          id: string
          name: string
          region: string
        }
        Insert: {
          capacity?: number
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          region: string
        }
        Update: {
          capacity?: number
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      forecast_projection_view: {
        Row: {
          confidence: number | null
          created_at: string | null
          current_stock_l: number | null
          forecast_date: string | null
          id: string | null
          incoming_l: number | null
          outgoing_l: number | null
          predicted_demand: number | null
          product_id: string | null
          projected_stock_l: number | null
          region: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_view_for_dashboard: {
        Row: {
          id: string | null
          last_updated: string | null
          product__category: string | null
          product__color: string | null
          product__id: string | null
          product__min_stock: number | null
          product__name: string | null
          product__pack_size_litres: number | null
          product__sku: string | null
          product__unit_price: number | null
          product_id: string | null
          quantity: number | null
          warehouse__id: string | null
          warehouse__name: string | null
          warehouse__region: string | null
          warehouse_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "planned_actions_view"
            referencedColumns: ["product__id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view_for_dashboard"
            referencedColumns: ["warehouse__id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_actions_view: {
        Row: {
          action_type: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          executed_at: string | null
          from_location: string | null
          id: string | null
          planned_execution_date: string | null
          product__category: string | null
          product__id: string | null
          product__min_stock: number | null
          product__name: string | null
          product__pack_size_litres: number | null
          product__sku: string | null
          product__unit_price: number | null
          product_id: string | null
          quantity: number | null
          recommendation_id: string | null
          status: string | null
          to_location: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      execute_dealer_order: {
        Args: {
          p_dealer_id: string
          p_product_id: string
          p_quantity: number
          p_recommendation_id?: string
          p_user_name?: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      execute_transfer: {
        Args: {
          p_dest_warehouse_id: string
          p_product_id: string
          p_quantity: number
          p_recommendation_id: string
          p_source_warehouse_id: string
          p_user_name?: string
        }
        Returns: Json
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "distributor" | "dealer" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "distributor", "dealer", "viewer"],
    },
  },
} as const
