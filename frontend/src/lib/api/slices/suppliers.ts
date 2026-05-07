import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Supplier } from "../../../types";
import { API_BASE } from "./base";

export interface Paginated<T> {
  items: T[];
  nextPageToken?: string | null;
  total?: number;
}

export type CreateSupplierRequest = Omit<Supplier, "id" | "createdAt" | "updatedAt">;
export type UpdateSupplierRequest = Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>;

export const supplierApi = createApi({
  reducerPath: "supplierApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ["Supplier"],
  endpoints: (builder) => ({
    listSuppliers: builder.query<
      Paginated<Supplier>,
      { limit?: number; pageToken?: string; q?: string; status?: "active" | "inactive" } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.limit) params.set("limit", String(args.limit));
        if (args?.pageToken) params.set("pageToken", args.pageToken);
        if (args?.q) params.set("q", args.q);
        if (args?.status) params.set("status", args.status);
        return { url: `/suppliers?${params.toString()}` };
      },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: "Supplier" as const, id })),
              { type: "Supplier" as const, id: "LIST" },
            ]
          : [{ type: "Supplier" as const, id: "LIST" }],
    }),

    createSupplier: builder.mutation<Supplier, CreateSupplierRequest>({
      query: (body) => ({ url: "/suppliers", method: "POST", body }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<Supplier, { id: string; patch: UpdateSupplierRequest }>({
      query: ({ id, patch }) => ({ url: `/suppliers/${id}`, method: "PUT", body: patch }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Supplier", id },
        { type: "Supplier", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),
  }),
});

export const {
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;
