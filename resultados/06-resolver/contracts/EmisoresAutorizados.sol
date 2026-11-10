// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

/// Resolver de aprendizaje (NO auditado): solo deja emitir a entidades autorizadas.
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

    /// Solo pasa si quien firma (attester) está autorizado.
    function onAttest(Attestation calldata attestation, uint256) internal view override returns (bool) {
        return autorizado[attestation.attester];
    }

    /// Revocar siempre se permite; EAS ya limita la revocación a quien emitió.
    function onRevoke(Attestation calldata, uint256) internal pure override returns (bool) {
        return true;
    }
}
