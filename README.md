# 🏗️ Supply Chain Management DApp

A complete decentralized application for supply chain management built with Solidity smart contracts and a responsive web3 frontend.

## 📸 Features

### Smart Contract System
- **Role Management**: Multi-role access control system
- **Items Management**: Product and location tracking
- **Supplier Management**: Vendor and inventory management
- **Warehouse Operations**: Stock transfers and inventory control
- **Store Management**: Retail operations and sales tracking
- **Treasury Management**: Escrow and payment systems
- **Customer Orders**: End-to-end order processing

### Frontend Interface
- **Responsive Design**: Mobile-friendly Bootstrap UI
- **MetaMask Integration**: Seamless wallet connection
- **Multi-Network Support**: Ganache, Sepolia, Polygon Mumbai
- **Real-time Updates**: Dynamic contract interaction
- **Role-based Access**: UI adapts based on user permissions
- **Transaction Tracking**: Loading states and error handling

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Ganache and deploy contracts:**
   ```bash
   npm run deploy:local
   ```

3. **Launch the frontend:**
   ```bash
   npm run dev
   ```

4. **Open browser at `http://localhost:3000`**

## 📁 Project Structure

```
dapp2-main/
├── contracts/              # Smart contract source code
│   ├── RoleManagement.sol
│   ├── ItemsBasicManagement.sol
│   ├── SuppliersManagement.sol
│   ├── CompanyTreasuryManager.sol
│   ├── WarehouseInventory.sol
│   ├── StoreInventory.sol
│   ├── WarehouseSupplierOrderManagement.sol
│   ├── CustomerOrder.sol
│   └── Interfaces.sol
├── migrations/             # Deployment scripts
├── frontend/              # Web3 frontend application
│   ├── index.html        # Main interface
│   ├── app.js           # Application logic
│   ├── contracts.js     # Contract ABIs and addresses
│   ├── config.js        # Network configuration
│   └── styles.css       # Responsive styling
├── scripts/              # Utility scripts
└── test/                # Contract tests
```

## 🎯 Core Contracts

### 1. RoleManagement
- Manages user roles and permissions
- Supports: Admin, Board, Finance Director, Warehouse Manager, Store Manager, Supplier

### 2. ItemsBasicManagement
- Product catalog management
- Store and warehouse location tracking
- Price management system

### 3. SuppliersManagement
- Supplier registration and approval
- Product listings and inventory
- Board approval workflow

### 4. CompanyTreasuryManager
- Escrow management for supplier payments
- Financial controls and approvals
- Payment release mechanisms

### 5. WarehouseInventoryManagement
- Stock level tracking
- Transfer requests to stores
- Supplier stock recording

### 6. StoreInventoryManagement
- Store-level inventory control
- Customer sale processing
- Stock confirmation from warehouses

### 7. WarehouseSupplierOrderManagement
- Purchase order management
- Supplier order processing
- Delivery confirmations

### 8. CustomerOrderManagement
- Customer order processing
- Return handling
- Order status tracking

## 🌐 Supported Networks

- **Ganache Local** (Chain ID: 5777)
- **Ethereum Sepolia** (Chain ID: 11155111)
- **Polygon Mumbai** (Chain ID: 80001)

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run compile          # Compile smart contracts
npm run extract-addresses # Extract deployed contract addresses

# Deployment
npm run deploy:local     # Deploy to Ganache
npm run deploy:sepolia   # Deploy to Sepolia testnet
npm run deploy:mumbai    # Deploy to Mumbai testnet
```

## 🎮 Using the DApp

### 1. Connect Wallet
- Install MetaMask browser extension
- Connect to the appropriate network
- Click "Kết nối MetaMask" in the interface

### 2. Role-based Operations

#### Admin/Board Members
- Grant and revoke user roles
- Approve suppliers
- Manage treasury operations

#### Warehouse Managers
- Process stock transfers
- Record supplier deliveries
- Handle customer returns

#### Store Managers
- Request stock from warehouses
- Process customer sales
- Confirm stock receipts

#### Suppliers
- List products and prices
- Manage inventory levels
- Fulfill orders

### 3. Key Workflows

#### Stock Transfer Flow
1. Store Manager requests stock transfer
2. Warehouse Manager processes request
3. Store Manager confirms receipt
4. Stock levels updated automatically

#### Supplier Order Flow
1. Warehouse Manager creates supplier order
2. Treasury Manager approves escrow
3. Supplier fulfills order
4. Payment released upon confirmation

#### Customer Order Flow
1. Customer places order at store
2. Store deducts inventory
3. Order processed and tracked
4. Returns handled if needed

## 🔐 Security Features

- **Role-based Access Control**: Multi-level permission system
- **Escrow Protection**: Secure payment handling
- **Input Validation**: Comprehensive data validation
- **Reentrancy Protection**: OpenZeppelin security standards
- **Event Logging**: Complete audit trail

## 🎨 Frontend Features

### User Interface
- Clean, intuitive design
- Responsive mobile layout
- Real-time status updates
- Error handling and notifications

### Web3 Integration
- MetaMask wallet connection
- Network detection and switching
- Transaction status tracking
- Gas estimation and optimization

### Smart Contract Interaction
- Dynamic contract loading
- Multi-network address management
- Automatic ABI handling
- Event listening and updates

## 🐛 Troubleshooting

### Common Issues
1. **Contract not found**: Run `npm run extract-addresses`
2. **Network mismatch**: Switch MetaMask to correct network
3. **Transaction failed**: Check gas limits and account permissions
4. **Connection issues**: Refresh page and reconnect wallet

### Debug Tools
- Browser developer console
- MetaMask transaction history
- Truffle console for contract interaction
- Network status indicators

## 📈 Testing

### Contract Testing
```bash
truffle test                    # Run all tests
truffle test test/specific.js   # Run specific test file
```

### Frontend Testing
- Manual testing with different user roles
- Cross-browser compatibility
- Mobile responsiveness
- Network switching scenarios

## 🚀 Deployment Process

1. **Compile contracts**
2. **Deploy to target network**
3. **Extract contract addresses**
4. **Update frontend configuration**
5. **Test all functionality**
6. **Verify contracts on block explorer**

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Frontend Setup](FRONTEND_SETUP.md) - Frontend configuration details
- [Contract Documentation](contracts/) - Smart contract source code
- [Migration Scripts](migrations/) - Deployment automation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

- OpenZeppelin for security contracts
- Truffle Suite for development framework
- Bootstrap for responsive UI components
- Web3.js for blockchain interaction

---

**Happy Building! 🏗️**

For support and questions, please check the documentation or open an issue.
#   n e w t e c h  
 