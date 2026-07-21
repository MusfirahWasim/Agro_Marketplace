import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./common/LoginPage";
import Layout from "./common/Layout";
import ProfileSettings from "./common/ProfileSettings";

import SupplierDashboard from "./supplier/SupplierDashboard";
import SupplierSupplies from "./supplier/SupplierSupplies";
import SupplierConsignments from "./supplier/SupplierConsignments";
import SupplierPayments from "./supplier/SupplierPayments";
import SupplierReports from "./supplier/SupplierReports";

import AgentDashboard from "./agent/AgentDashboard";
import AgentOrders from "./agent/AgentOrders";
import AgentInventory from "./agent/AgentInventory";
import AgentCommissions from "./agent/AgentCommissions";
import AgentSettlements from "./agent/AgentSettlements";
import AgentConsignmentIntake from "./agent/AgentConsignmentIntake";
import AgentPriceRecommendations from "./agent/AgentPriceRecommendations";

import BuyerMarketplace from "./buyer/BuyerMarketplace";
import BuyerProductDetail from "./buyer/BuyerProductDetail";
import BuyerCheckout from "./buyer/BuyerCheckout";
import BuyerOrders from "./buyer/BuyerOrders";

import SignupPage from "./common/SignupPage";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Supplier area — Layout provides sidebar/topbar, nested routes render via <Outlet /> */}
        <Route path="/supplier" element={<Layout role="supplier" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SupplierDashboard />} />
          <Route path="supplies" element={<SupplierSupplies />} />
          <Route path="profile" element={<ProfileSettings role="supplier" />} />
          <Route path="consignments" element={<SupplierConsignments />} />
          <Route path="payments" element={<SupplierPayments />} />
          <Route path="reports" element={<SupplierReports />} />
        </Route>

        {/* Commission Agent area */}
        <Route path="/agent" element={<Layout role="agent" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="inventory" element={<AgentInventory />} />
          <Route path="orders" element={<AgentOrders />} />
          <Route path="profile" element={<ProfileSettings role="agent" />} />
          <Route path="commissions" element={<AgentCommissions />} />
          <Route path="settlements" element={<AgentSettlements />} />
          <Route path="consignment-intake" element={<AgentConsignmentIntake />} />
          <Route path="price-recommendations" element={<AgentPriceRecommendations />} />
        </Route>

        {/* Buyer area */}
        <Route path="/buyer" element={<Layout role="buyer" />}>
          <Route index element={<Navigate to="marketplace" replace />} />
          <Route path="marketplace" element={<BuyerMarketplace />} />
          <Route path="product/:consignId" element={<BuyerProductDetail />} />
          <Route path="checkout" element={<BuyerCheckout />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="profile" element={<ProfileSettings role="buyer" />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}