import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { StoreProfileLayout } from "./store-profile/StoreProfileLayout";
import { StoreIdentityModule } from "./store-profile/modules/StoreIdentityModule";
import { StoreOperationalConfigModule } from "./store-profile/modules/StoreOperationalConfigModule";
import { StoreSupplyConfigModule } from "./store-profile/modules/StoreSupplyConfigModule";
import { StoreInfrastructureModule } from "./store-profile/modules/StoreInfrastructureModule";
import { StoreChannelBindingModule } from "./store-profile/modules/StoreChannelBindingModule";
import { StoreGovernanceModule } from "./store-profile/modules/StoreGovernanceModule";

// Placeholder components for unimplemented modules
const PlaceholderModule: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in">
    <h3 className="text-xl font-black italic tracking-wider">
      {name.toUpperCase()}
    </h3>
    <p className="text-sm mt-2 max-w-md text-center">
      This module is currently under development.
    </p>
  </div>
);

const StoreProfile: React.FC = () => {
  return (
    <StoreProfileLayout>
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<StoreIdentityModule />} />
        <Route path="operations" element={<StoreOperationalConfigModule />} />
        <Route path="logistics" element={<StoreSupplyConfigModule />} />
        <Route path="hardware" element={<StoreInfrastructureModule />} />
        <Route path="channels" element={<StoreChannelBindingModule />} />
        <Route path="governance" element={<StoreGovernanceModule />} />
      </Routes>
    </StoreProfileLayout>
  );
};

export default StoreProfile;
