import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Parámetros: la dirección de EAS en la red y el owner (admin). Vienen de configuración.
export default buildModule("EmisoresAutorizadosModule", (m) => {
  const eas = m.getParameter("eas");
  const owner = m.getParameter("owner");
  const resolver = m.contract("EmisoresAutorizados", [eas, owner]);
  return { resolver };
});
