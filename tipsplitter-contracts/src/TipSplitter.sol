// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TipSplitter
 * @notice Permet de répartir automatiquement les paiements ETH entre plusieurs adresses
 * selon des pourcentages définis par l'utilisateur
 */
contract TipSplitter {
    /// @notice Structure représentant un destinataire avec son adresse et sa part en basis points
    struct Recipient {
        address addr;
        uint96 shareBps; // Parts en basis points (1 bps = 0.01%)
    }

    /// @notice Mapping qui associe chaque utilisateur à sa configuration de split
    mapping(address => Recipient[]) public splits;

    /// @notice Constante pour 100% en basis points
    uint256 public constant TOTAL_BPS = 10_000;

    /// @notice Événement émis lors de la distribution d'un tip
    /// @param sender L'adresse qui a envoyé l'ETH
    /// @param owner Le propriétaire de la configuration de split utilisée
    /// @param amount Le montant total distribué
    event TipDistributed(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    /// @notice Événement émis lors de la mise à jour d'une configuration de split
    /// @param owner L'adresse dont la configuration a été mise à jour
    /// @param recipientsCount Le nombre de destinataires dans la nouvelle configuration
    event SplitUpdated(address indexed owner, uint256 recipientsCount);

    /// @notice Erreur émise lorsque la configuration est vide
    error EmptyConfiguration();

    /// @notice Erreur émise lorsque le total des parts n'est pas égal à 10_000 bps
    error InvalidTotalShares();

    /// @notice Erreur émise lorsqu'une adresse de destinataire est nulle
    error InvalidRecipientAddress();

    /// @notice Erreur émise lorsqu'une part est égale à zéro
    error InvalidShare();

    /// @notice Erreur émise lorsque l'envoi d'ETH échoue
    error TransferFailed();

    /**
     * @notice Modifier qui vérifie qu'une configuration de split n'est pas vide
     * @param owner L'adresse dont on vérifie la configuration
     */
    modifier nonEmptyConfig(address owner) {
        require(splits[owner].length > 0, "Split configuration is empty");
        _;
    }

    /**
     * @notice Définit la configuration de split pour l'appelant
     * @param recipients Liste des destinataires avec leurs parts respectives
     * @dev Le total des parts doit être exactement 10_000 bps (100%)
     */
    function setSplit(Recipient[] calldata recipients) external {
        require(recipients.length > 0, "Recipients list cannot be empty");

        uint256 totalBps = 0;

        // Validation des destinataires et calcul du total
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                recipients[i].addr != address(0),
                "Recipient address cannot be zero"
            );
            require(recipients[i].shareBps > 0, "Share must be greater than 0");
            totalBps += recipients[i].shareBps;
        }

        require(totalBps == TOTAL_BPS, "Total shares must equal 10000 bps");

        // Suppression de l'ancienne configuration
        delete splits[msg.sender];

        // Ajout de la nouvelle configuration
        for (uint256 i = 0; i < recipients.length; i++) {
            splits[msg.sender].push(recipients[i]);
        }

        emit SplitUpdated(msg.sender, recipients.length);
    }

    /**
     * @notice Permet de déposer de l'ETH et le répartir automatiquement
     * @dev L'ETH est distribué immédiatement aux destinataires selon la configuration de l'appelant
     */
    function deposit() external payable nonEmptyConfig(msg.sender) {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        Recipient[] storage recipients = splits[msg.sender];
        uint256 totalAmount = msg.value;

        // Distribution des fonds aux destinataires
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 amount;

            // Pour le dernier destinataire, on envoie tout le reste pour éviter les pertes dues aux arrondis
            if (i == recipients.length - 1) {
                amount = address(this).balance;
            } else {
                amount = (totalAmount * recipients[i].shareBps) / TOTAL_BPS;
            }

            (bool success, ) = recipients[i].addr.call{value: amount}("");
            require(success, "Transfer to recipient failed");
        }

        emit TipDistributed(msg.sender, msg.sender, totalAmount);
    }

    /**
     * @notice Permet à un tiers de déposer de l'ETH pour un utilisateur spécifique
     * @param owner L'adresse dont la configuration de split sera utilisée
     * @dev L'ETH est distribué immédiatement aux destinataires selon la configuration du owner
     */
    function depositFor(address owner) external payable nonEmptyConfig(owner) {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(owner != address(0), "Owner address cannot be zero");

        Recipient[] storage recipients = splits[owner];
        uint256 totalAmount = msg.value;

        // Distribution des fonds aux destinataires
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 amount;

            // Pour le dernier destinataire, on envoie tout le reste pour éviter les pertes dues aux arrondis
            if (i == recipients.length - 1) {
                amount = address(this).balance;
            } else {
                amount = (totalAmount * recipients[i].shareBps) / TOTAL_BPS;
            }

            (bool success, ) = recipients[i].addr.call{value: amount}("");
            require(success, "Transfer to recipient failed");
        }

        emit TipDistributed(msg.sender, owner, totalAmount);
    }

    /**
     * @notice Retourne la configuration de split complète d'un utilisateur
     * @param user L'adresse de l'utilisateur dont on veut récupérer la configuration
     * @return recipients La liste complète des destinataires et leurs parts
     */
    function getSplit(address user)
        external
        view
        returns (Recipient[] memory recipients)
    {
        return splits[user];
    }

    /**
     * @notice Retourne le nombre de destinataires dans la configuration d'un utilisateur
     * @param user L'adresse de l'utilisateur
     * @return count Le nombre de destinataires
     */
    function getSplitLength(address user) external view returns (uint256) {
        return splits[user].length;
    }

    /**
     * @notice Fallback function pour recevoir de l'ETH directement
     * @dev Redirige vers la fonction deposit()
     */
    receive() external payable {
        require(splits[msg.sender].length > 0, "Split configuration is empty");
        
        Recipient[] storage recipients = splits[msg.sender];
        uint256 totalAmount = msg.value;

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 amount;
            if (i == recipients.length - 1) {
                amount = address(this).balance;
            } else {
                amount = (totalAmount * recipients[i].shareBps) / TOTAL_BPS;
            }

            (bool success, ) = recipients[i].addr.call{value: amount}("");
            require(success, "Transfer to recipient failed");
        }

        emit TipDistributed(msg.sender, msg.sender, totalAmount);
    }
}
