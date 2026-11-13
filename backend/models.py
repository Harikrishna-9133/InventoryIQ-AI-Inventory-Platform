from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="customer", nullable=False)
    auth_provider = Column(String(50), default="local")
    profile_image = Column(String(500), nullable=True)
    status = Column(String(50), default="active")
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    phone = Column(String(30), nullable=True)
    department = Column(String(100), nullable=True)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(150))
    phone = Column(String(30))
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(150))
    phone = Column(String(30))
    address = Column(Text)
    lead_time_days = Column(Integer, default=7)
    created_at = Column(DateTime, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    sku = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(String(150), nullable=False)
    description = Column(Text)

    price = Column(
        Float,
        nullable=False,
        default=0
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.id"),
        nullable=True
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True
    )

    reorder_level = Column(
        Integer,
        default=10
    )

    safety_stock = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(150),
        nullable=False
    )

    location = Column(String(255))

    manager_name = Column(String(100))

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    warehouse_id = Column(
        Integer,
        ForeignKey("warehouses.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        default=0
    )

    reserved_quantity = Column(
        Integer,
        default=0
    )

    available_quantity = Column(
        Integer,
        default=0
    )

    last_updated = Column(
        DateTime,
        default=datetime.utcnow
    )

    product = relationship(
        "Product",
        foreign_keys=[product_id]
    )

    warehouse = relationship(
        "Warehouse",
        foreign_keys=[warehouse_id]
    )

class Sale(Base):
    __tablename__ = "sales"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True
    )

    total_amount = Column(
        Float,
        default=0
    )

    sale_date = Column(
        DateTime,
        default=datetime.utcnow
    )

    customer = relationship(
        "Customer",
        foreign_keys=[customer_id]
    )

    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan"
    )


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    sale_id = Column(
        Integer,
        ForeignKey("sales.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    unit_price = Column(
        Float,
        nullable=False
    )

    total_price = Column(
        Float,
        nullable=False
    )

    sale = relationship(
        "Sale",
        back_populates="items"
    )

    product = relationship(
        "Product",
        foreign_keys=[product_id]
    )


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.id"),
        nullable=False
    )

    status = Column(
        String,
        default="pending"
    )

    total_amount = Column(
        Float,
        default=0
    )

    order_date = Column(
        DateTime,
        default=datetime.utcnow
    )

    expected_delivery = Column(
        DateTime,
        nullable=True
    )

    supplier = relationship(
        "Supplier",
        foreign_keys=[supplier_id]
    )

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan"
    )
class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    purchase_order_id = Column(
        Integer,
        ForeignKey("purchase_orders.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    unit_price = Column(
        Float,
        nullable=False
    )

    total_price = Column(
        Float,
        nullable=False
    )

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="items"
    )

    product = relationship(
        "Product",
        foreign_keys=[product_id]
    )

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    forecast_date = Column(
        DateTime,
        nullable=False
    )

    predicted_demand = Column(
        Float,
        nullable=False
    )

    confidence_score = Column(
        Float,
        nullable=True
    )

    model_name = Column(
        String(100),
        default="LSTM"
    )

    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    recipient_email = Column(
        String(150),
        nullable=False
    )

    notification_type = Column(
        String(100),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=True
    )

    purchase_order_id = Column(
        Integer,
        ForeignKey("purchase_orders.id"),
        nullable=True
    )

    subject = Column(String(255))

    message = Column(Text)

    status = Column(
        String(50),
        default="pending"
    )

    error_message = Column(Text, nullable=True)

    sent_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )