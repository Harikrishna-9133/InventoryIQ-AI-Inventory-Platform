from typing import Optional

from pydantic import BaseModel, ConfigDict


# =========================================================
# PRODUCT SCHEMAS
# =========================================================

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: float = 0
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
    reorder_level: int = 10
    safety_stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
    reorder_level: Optional[int] = None
    safety_stock: Optional[int] = None


class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# CUSTOMER SCHEMAS
# =========================================================

class CustomerBase(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# SUPPLIER SCHEMAS
# =========================================================

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    lead_time_days: int = 7


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    lead_time_days: Optional[int] = None


class SupplierResponse(SupplierBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True
    )
    
# =========================================================
# WAREHOUSE SCHEMAS
# =========================================================

class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    manager_name: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    manager_name: Optional[str] = None


class WarehouseResponse(WarehouseBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True
    )
    
# =========================================================
# INVENTORY SCHEMAS
# =========================================================

class InventoryBase(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = 0
    reserved_quantity: int = 0


class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    product_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    quantity: Optional[int] = None
    reserved_quantity: Optional[int] = None


class InventoryResponse(InventoryBase):
    id: int
    available_quantity: int

    model_config = ConfigDict(
        from_attributes=True
    )
    
# =========================================================
# SALES SCHEMAS
# =========================================================

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float

    model_config = ConfigDict(
        from_attributes=True
    )


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: list[SaleItemCreate]


class SaleResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    total_amount: float
    sale_date: object
    items: list[SaleItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )
    
# =========================================================
# PURCHASE ORDER SCHEMAS
# =========================================================

class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float

    model_config = ConfigDict(
        from_attributes=True
    )


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseOrderItemCreate]


class PurchaseOrderResponse(BaseModel):
    id: int
    supplier_id: int
    status: str
    total_amount: float
    order_date: object
    expected_delivery: Optional[object] = None
    items: list[PurchaseOrderItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )
    
# =========================================================
# RECEIVE PURCHASE ORDER SCHEMA
# =========================================================

class ReceivePurchaseOrder(BaseModel):
    warehouse_id: int