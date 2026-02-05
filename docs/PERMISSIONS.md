# Permissions Guide (RBAC)

This document describes every permission available in the SIA POS system and its impact on the user experience.

## 1. Sales (Ventas)
- `CREATE_SALE`: Allows the user to open the POS, add items, and complete transactions.
- `VIEW_SALES`: Allows access to the sales history and details of previous transactions.
- `CANCEL_SALE`: Allows voiding or canceling an already completed sale (requires higher privilege).
- `REFUND_SALE`: Allows processing refunds for items or whole sales.

## 2. Products (Productos)
- `MANAGE_PRODUCTS`: Global permission to create, edit, and delete products from the catalog.
- `CREATE_PRODUCT`: Specifically for adding new items.
- `EDIT_PRODUCT`: For modifying existing product info.
- `DELETE_PRODUCT`: For removing products (destructive).
- `VIEW_PRODUCT`: Access to view product details and catalog.
- `ADJUST_STOCK`: Allows manual stock adjustments (stock takes, corrections).
- `EDIT_PRICE`: Allows changing the selling price of an item.

## 3. Users (Usuarios)
- `CREATE_USER`, `EDIT_USER`, `DELETE_USER`: Managing employees and system access.
- `VIEW_USERS`: Viewing the list of staff and their roles.

## 4. System (Sistema)
- `MANAGE_SETTINGS`: Access to global system configurations (store name, tax rates, etc.).
- `VIEW_AUDIT_LOG`: Access to the security trail (who did what and when).
- `VIEW_ERROR_LOG`: Access to system error reports for debugging.

## 5. Reports (Reportes)
- `VIEW_REPORTS`: Access to sales summaries, inventory reports, and performance charts.
- `EXPORT_REPORTS`: Permission to download data in CSV/Excel format.

## Implementation Example
```tsx
<RequirePermission permission="MANAGE_PRODUCTS">
  <button>Add New Product</button>
</RequirePermission>
```
