# Ejercicio 06: resolver de emisores autorizados

**Bloque:** consola + Solidity | **Dificultad:** alta | **Tiempo:** 4 a 6 h | **Depende de:** 02

## Objetivo

Escribir, probar y desplegar un contrato resolver que solo deje emitir a entidades autorizadas, y registrar un schema que lo use.

## Qué vas a entender

- EAS consulta al resolver en cada attestation y revocación del schema. Si responde `false`, la transacción se revierte.
- El resolver queda fijo en el schema. Cambiarlo implica registrar un schema nuevo con otro UID.
- El UID del schema depende de la dirección del resolver (importante para multichain).

## Instrucciones para Claude Code

### Archivos a crear

- `contracts/` (proyecto **Hardhat 3**, no Foundry; documentación: https://hardhat.org/docs/getting-started). Se crea con `npx hardhat --init` (requiere Node 22.13+). Elegir una plantilla que use el ejecutor de pruebas de Node (por ejemplo `node-test-runner-viem`; ver `npx hardhat --init --templates`) y anotar cuál se eligió. Dependencias: `@ethereum-attestation-service/eas-contracts` (por npm) y, si se necesita, OpenZeppelin. Verificar la versión de Solidity que exigen y fijarla en `hardhat.config.ts`.
- `contracts/contracts/EmisoresAutorizados.sol` (Hardhat usa `contracts/` como carpeta de fuentes)
- `contracts/test/EmisoresAutorizados.ts` (también vale un `.t.sol` si la versión instalada lo soporta)
- `contracts/ignition/modules/EmisoresAutorizados.ts` (módulo de despliegue con Hardhat Ignition) o un script en `contracts/scripts/`
- `ejercicios/06-resolver/registrar-schema-resolver.js`, `probar-en-testnet.js` (usan `ethers` y el SDK de EAS, como en los ejercicios anteriores)

**Base Sepolia en `hardhat.config.ts`:** definir la red con `type: "http"`, el `chainType` que corresponda al stack OP (verificar el valor en la documentación; el ejemplo oficial de Sepolia L1 usa `"l1"`), y `url` y `accounts` con `configVariable(...)`. Las llaves de prueba van en el keystore cifrado de Hardhat (`npx hardhat keystore set NOMBRE`) o en `.env.local` (nunca en el repositorio). Nunca escribir una llave en el archivo de configuración. Solo llaves de testnet.

### Contrato (punto de partida, no está auditado)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26; // ajustar a la versión que exija eas-contracts

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

contract EmisoresAutorizados is SchemaResolver {
    address public owner;
    mapping(address => bool) public autorizado;

    event EmisorActualizado(address indexed emisor, bool estado);
    event OwnerTransferido(address indexed anterior, address indexed nuevo);

    error SoloOwner();
    error DireccionInvalida();

    modifier soloOwner() {
        if (msg.sender != owner) revert SoloOwner();
        _;
    }

    constructor(IEAS eas, address owner_) SchemaResolver(eas) {
        if (owner_ == address(0)) revert DireccionInvalida();
        owner = owner_;
    }

    function autorizar(address emisor, bool estado) external soloOwner {
        if (emisor == address(0)) revert DireccionInvalida();
        autorizado[emisor] = estado;
        emit EmisorActualizado(emisor, estado);
    }

    function transferirOwner(address nuevo) external soloOwner {
        if (nuevo == address(0)) revert DireccionInvalida();
        emit OwnerTransferido(owner, nuevo);
        owner = nuevo;
    }

    // Solo pasa si quien firma está autorizado
    function onAttest(Attestation calldata attestation, uint256)
        internal view override returns (bool)
    {
        return autorizado[attestation.attester];
    }

    // Revocar siempre se permite; EAS ya limita a quien emitió
    function onRevoke(Attestation calldata, uint256)
        internal pure override returns (bool)
    {
        return true;
    }
}
```

Pedir a Claude Code que **revise el contrato** contra la versión instalada de `SchemaResolver` (firma de constructor y funciones) antes de compilar.

### Pasos

1. Crear el proyecto Hardhat 3 (`npx hardhat --init`), instalar `eas-contracts` y compilar (`npx hardhat build`; verificar el nombre del comando en la versión instalada).
2. Pruebas con `npx hardhat test`: desplegar EAS y el registro de schemas en la red local simulada de Hardhat dentro del test, o, si resulta demasiado pesado, probar directamente en testnet con JS en el paso 5.
3. Casos de prueba: owner autoriza; no-owner no puede autorizar; emisor autorizado emite; emisor no autorizado se revierte; emisor desautorizado ya no emite pero **sí puede revocar** lo que emitió antes.
4. Desplegar en Base Sepolia con `admin` como owner, con Hardhat Ignition y `--network` apuntando a la red configurada (verificar el comando exacto en https://hardhat.org/docs/guides/deployment/using-ignition). Guardar la dirección en configuración.
5. Registrar un **schema nuevo** (mismo texto del ejercicio 02) apuntando al resolver, con `revocable = true`, y guardar su UID.
6. En testnet: autorizar `emisorA`, emitir con éxito; intentar con `emisorB` y comprobar el rechazo; desautorizar a `emisorA`, intentar emitir (rechazo) y revocar una attestation previa (éxito).

## Criterio de éxito

- Pruebas de Hardhat (`npx hardhat test`) en verde (o equivalentes en JS contra testnet).
- Se comprueban en testnet los tres casos: autorizado pasa, no autorizado falla, desautorizado puede revocar.
- El schema con resolver tiene un UID distinto al del ejercicio 02.

## Preguntas de comprensión

1. ¿Qué dirección ve el resolver como `attester` cuando la entidad envía la transacción directamente? (Se confirma en el ejercicio 07.)
2. ¿Por qué `onRevoke` devuelve siempre `true`?
3. ¿Qué riesgo tiene que el owner sea una sola wallet y cómo se reduciría en producción?

## Qué anotar

Versiones de Hardhat, de Solidity y de las librerías, plantilla elegida en `--init`, dirección del contrato, gas de despliegue y de `autorizar`, errores de compilación encontrados.

## Advertencias

- Este contrato es de aprendizaje. En producción necesita auditoría, owner multisig y una política de rotación.
- Una vez que un schema usa un resolver, ese resolver no se cambia.
