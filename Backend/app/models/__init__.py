from app.models.user import User
from app.models.commission_agent import CommissionAgent
from app.models.buyer import Buyer
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.supplier_supply import SupplierSupply
from app.models.consignment import Consignment
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.commission import Commission
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.payment import Payment
from app.models.receipt import Receipt

__all__ = [
    "User",
    "CommissionAgent",
    "Buyer",
    "Supplier",
    "Product",
    "SupplierSupply",
    "Consignment",
    "Sale",
    "SaleItem",
    "Commission",
    "Account",
    "Transaction",
    "Payment",
    "Receipt",
]

# Every model must be imported here, once, before SQLAlchemy configures
# its mappers -- relationship() strings (e.g. "CommissionAgent") only
# resolve correctly if the referenced class has already been imported
# somewhere by then. This file is what guarantees that; make sure
# main.py (or wherever Base.metadata is first used) imports from
# app.models, not from individual model files directly.