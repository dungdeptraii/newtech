Hợp đồng Tham Chiếu:
1. RM: RoleManagement.sol
2. IBM: ItemsBasicManagement.sol (Quản lý mặt hàng cơ bản và địa điểm)
3. SM: SuppliersManagement.sol (Quản lý nhà cung cấp)
4. WIM: WarehouseInventoryManagement.sol
5. SIM: StoreInventoryManagement.sol
6. CTM: CompanyTreasuryManager.sol
7. WSOM: WarehouseSupplierOrderManagement.sol
8. COM: CustomerOrderManagement.sol

LƯU Ý: ItemsManagement.sol gốc đã được tách thành ItemsBasicManagement.sol và SuppliersManagement.sol 
để giải quyết vấn đề kích thước contract quá lớn không thể deploy được.
________________


Tổng Hợp Chức Năng Theo Vai Trò:
1. DEFAULT_ADMIN_ROLE (Quản trị viên Hệ thống Cao nhất)
Thường là người deploy các hợp đồng hoặc một nhóm quản trị cốt lõi.
* RM:
   * Thêm/Xóa thành viên Hội đồng quản trị (BoardMember).
   * Cấp/Thu hồi các vai trò QUAN TRỌNG như BOARD_ROLE ban đầu.
   * (Có thể) Gọi các hàm khẩn cấp của RM nếu có.
* IBM (ItemsBasicManagement):
   * Quản lý thông tin cơ bản: mặt hàng (items), địa điểm (kho/cửa hàng), giá bán lẻ
   * (Nếu có) Phê duyệt các loại sản phẩm mới ở cấp độ cao nhất.
   * (Nếu có) Gọi các hàm khẩn cấp, thay đổi các tham số hệ thống quan trọng.
   * (Nếu có) Set địa chỉ của các hợp đồng phụ thuộc (như RM) nếu IBM cần.
* SM (SuppliersManagement):
   * Quản lý thông tin nhà cung cấp và việc niêm yết sản phẩm của NCC
   * (Nếu có) Phê duyệt nhà cung cấp mới và niêm yết sản phẩm từ NCC.
* WIM (WarehouseInventoryManagement):
   * Là owner (nếu WIM kế thừa Ownable):
      * Set địa chỉ của CustomerOrderManagementAddress (COM).
      * Set địa chỉ của WarehouseSupplierOrderManagementAddress (WSOM).
      * Thực hiện điều chỉnh tồn kho thủ công (adjustStockManually).
      * Xử lý hàng tồn kho bị khách trả về (processCustomerReturnedStock).
* SIM (StoreInventoryManagement):
   * Là owner (nếu SIM kế thừa Ownable):
      * Set địa chỉ WarehouseInventoryManagement để yêu cầu hàng từ kho.
* CTM:
   * Là owner (nếu CTM kế thừa Ownable):
      * Set địa chỉ của WarehouseSupplierOrderManagementAddress (WSOM).
      * Set/Thay đổi Giám đốc Tài chính (setInitialFinanceDirector, changeFinanceDirector).
      * Set địa chỉ của CustomerOrderManagementAddress (COM) để hỗ trợ hoàn tiền.
      * (Nếu có) Rút tiền khẩn cấp toàn bộ quỹ.
* WSOM:
   * Là owner (nếu WSOM kế thừa Ownable):
      * Set địa chỉ của WarehouseInventoryManagement (WIM).
* COM:
   * Là owner (nếu COM kế thừa Ownable):
      * Set địa chỉ của StoreInventoryManagement (SIM).
      * Set địa chỉ của WarehouseInventoryManagement (WIM) để xử lý trả hàng.
      * Set địa chỉ của CompanyTreasuryManager (CTM) để hỗ trợ hoàn tiền.
      * Thực hiện rút tiền khẩn cấp (emergencyWithdraw).
2. BOARD_ROLE (Hội đồng Quản trị)
* RM:
   * Cấp/Thu hồi các vai trò Giám đốc (WAREHOUSE_DIRECTOR_ROLE, STORE_DIRECTOR_ROLE, FIN_DIRECTOR_ROLE) và SUPPLIER_ROLE (yêu cầu bỏ phiếu >50% cổ phần).
* IBM + SM:
   * Phê duyệt các mặt hàng mới do Nhà cung cấp đề xuất (approveSupplierItemListing trong SM).
   * Phê duyệt Nhà cung cấp mới, Cửa hàng mới, Kho mới (trong IBM và SM với sự chấp thuận của Board).
   * Thiết lập các chính sách chung liên quan đến sản phẩm, nhà cung cấp.
* CTM:
   * (Có thể) Là một trong các bên ký của ví đa chữ ký (nếu owner của CTM là ví đa chữ ký của Board) để phê duyệt các giao dịch rút tiền lớn hoặc thay đổi GĐTC.
* 3. FINANCE_DIRECTOR_ROLE (Giám đốc Tài chính - GĐTC)
* CTM:
   * Thực hiện chuyển tiền cho các vai trò nội bộ nếu số dư của họ dưới ngưỡng (transferToInternalRole).
   * Thiết lập chính sách chi tiêu cho Kho khi đặt hàng Nhà cung cấp (setWarehouseSpendingPolicy).
   * Thực hiện các giao dịch rút tiền chung từ quỹ công ty (generalWithdrawal) - có thể cần kiểm soát thêm tùy mức độ tin cậy.
   * (Nếu có) Reset giới hạn chi tiêu định kỳ của kho.
* 4. WAREHOUSE_DIRECTOR_ROLE (Giám đốc Kho)
* RM:
   * Cấp/Thu hồi vai trò WAREHOUSE_MANAGER_ROLE cho các Quản lý Kho.
* IBM:
   * (Nếu có) Thiết lập chính sách cho phép các kho dưới quyền được mua những mặt hàng nào từ những nhà cung cấp nào.
   * Quản lý thông tin các kho thuộc phạm vi của mình.
   * Gán manager cho các địa điểm kho (assignManagerToLocation).
5. STORE_DIRECTOR_ROLE (Giám đốc Cửa hàng)
* RM:
   * Cấp/Thu hồi vai trò STORE_MANAGER_ROLE cho các Quản lý Cửa hàng.
* IBM:
   * Quản lý thông tin các cửa hàng thuộc phạm vi của mình.
   * Gán manager cho các địa điểm cửa hàng (assignManagerToLocation).
   * Đặt giá bán lẻ cho mặt hàng tại cửa hàng (setStoreItemRetailPrice).
   * Chỉ định kho nguồn cho cửa hàng (setDesignatedSourceWarehouseForStore).
6. WAREHOUSE_MANAGER_ROLE (Quản lý Kho)
* COM:
   * Xử lý mặt hàng trong đơn hàng của khách (warehouseProcessOrderItem), dẫn đến việc trừ tồn kho trong WIM.
   * (Nếu có) Hủy đơn hàng của khách nếu kho không thể xử lý (cancelOrderByWarehouse trong COM).
* WSOM:
   * Đặt hàng với Nhà cung cấp (placeOrderByWarehouse), kích hoạt việc escrow tiền từ CTM.   * Xác nhận đã nhận hàng từ Nhà cung cấp (warehouseConfirmReceipt), kích hoạt việc giải ngân cho NCC từ CTM và cộng tồn kho trong WIM.
   * Hủy đơn hàng đã đặt với Nhà cung cấp (trước khi NCC giao) (cancelOrderByWarehouse trong WSOM), kích hoạt việc hoàn tiền escrow về CTM.
7. STORE_MANAGER_ROLE (Quản lý Cửa hàng)
* COM:
   * Xác nhận đã nhận mặt hàng từ Kho (storeReceiveItemFromWarehouse).
   * Xác nhận đã giao hàng cho Khách hàng (storeConfirmDeliveryToCustomer).
   * (Nếu có) Hủy đơn hàng của khách nếu cửa hàng không thể giao (cancelOrderByStore trong COM).
8. SUPPLIER_ROLE (Nhà cung cấp)
* SM:
   * Đề xuất các mặt hàng mới để bán cho hệ thống (proposeNewItem).
   * Niêm yết mặt hàng với giá cả (listSupplierItem).
* WSOM:
   * Xác nhận đã giao hàng cho Kho (supplierConfirmShipment).
   * (Nếu có) Hủy/Từ chối đơn hàng từ Kho (cancelOrderBySupplier trong WSOM).
9. Khách hàng (Customer - không phải là một vai trò được cấp trong RM, mà là msg.sender của các giao dịch)
* COM:
   * Đặt hàng và thanh toán (placeOrder).
   * Xác nhận đã nhận hàng (customerConfirmReceipt), kích hoạt việc giải ngân tiền từ COM vào CTM.
   * (Nếu có) Hủy đơn hàng trước khi nhận (customerCancelOrderBeforeReceipt).
   * (Nếu có) Yêu cầu trả hàng sau khi đã nhận (customerReturnOrderAfterReceipt).
Tóm tắt các điểm chính về phân quyền và trách nhiệm:
* Quyền lực tập trung ở cấp cao: DEFAULT_ADMIN_ROLE và BOARD_ROLE có quyền thiết lập và thay đổi cấu trúc, chính sách quan trọng.
* Phân cấp quản lý: Giám đốc (Director) quản lý các Quản lý (Manager).
* Tương tác dựa trên vai trò: Các hành động trong quy trình nghiệp vụ (đặt hàng, xử lý, xác nhận) được thực hiện bởi các vai trò cụ thể.
* Tài chính có kiểm soát: GĐTC quản lý quỹ công ty, nhưng các giao dịch lớn hoặc chính sách quan trọng (như spending policy cho kho) được thiết lập hoặc có thể cần phê duyệt từ cấp cao hơn.
* Minh bạch và tự động hóa: Nhiều bước được tự động hóa bởi smart contract, giảm thiểu sai sót và tăng tính minh bạch.

Các vai trò


Biến
	Tên
	Độ truy cập
	Vai trò thay đổi
	Điều kiện
	siêu cấp admin
	DEFAULT_ADMIN_ROLE
	toàn quyền quyết định
	

	đang là 3 người mở blockchain ban đầu, chưa thể thay đổi được
	tài khoản Thành viên ban điều hành
	BOARD_ROLE
	

	DEFAULT_ADMIN_ROLE
	>50% cổ phần đồng ý
	Giám đốc Warehouse
	WAREHOUSE_DIRECTOR_ROLE
	

	

	

	Giám đốc Store
	STORE_DIRECTOR_ROLE
	

	

	

	Giám đốc Tài chính
	

	

	

	

	QL Warehouse
	

	

	

	

	QL Store
	

	

	

	

	Supplier
	

	Chỉ khi ban điều hành add vào
	

	Đồng ý với điều khoản 
	Customer
	

	Tự do truy cập
	

	Cung cấp đủ thông tin bao gồm:
+ địa chỉ tk
+ địa chỉ giao hàng
+ sđt
+Tên
	

Biến
	Tên
	Loại
	Vai trò truy cập
	Vai trò thay đổi
	Điều kiện
	Tiền cổ phần
	shareCaptial
	

	Ban điều hành
	

	

	Tổng tiền cổ phần
	totalCapital
	

	Ban điều hành
	

	

	% cổ phần
	share
	

	Nội bộ công ty
	

	

	

	

	

	

	

	

	Quỹ chung công ty
	companyTreasury
	

	Ban điều hành và GĐ tài chính
	GĐ tài chính
	= Tổng tiền cổ phần + Doanh thu - chi phí
	Doanh thu
	Revenue
	

	Ban điều hành và GĐ tài chính
	

	Nhận từ Customer
	Chi phí duy trì hoạt động
	Operate
	

	Ban điều hành và các GĐ 
	GĐ tài chính
	Quy định điều kiện mỗi tháng
	Địa chỉ warehouse
	

	

	Nội bộ công ty
	

	ban điều hành >50%
	Địa chỉ Retail
	

	

	Nội bộ công ty
	

	ban điều hành >50%
	* Khả năng cập nhật shareCapital: 
Hiện tại không có chức năng nào cho phép thay đổi shareCapital của một thành viên hiện có. Nếu đây là một yêu cầu, bạn cần thêm chức năng này (và có thể cũng cần sự chấp thuận của HĐQT).
* Trường hợp totalCapital bằng 0:
Nếu tất cả thành viên Ban điều hành bị xóa hoặc vốn của họ trở thành 0, totalCapital sẽ là 0.
Hàm getShares trả về 0 trong trường hợp này.
Khi đó, _sumShares cũng sẽ trả về 0.
Yêu cầu approvalShares > 5000 (tức > 50%) trong addBoardMember sẽ không bao giờ được đáp ứng nếu totalCapital là 0, vì approvalShares cũng sẽ là 0. Điều này có nghĩa là không thể thêm thành viên mới nào nếu HĐQT bị giải thể (về mặt vốn). Đây có thể là một tình huống bế tắc (deadlock). Cần cân nhắc cách xử lý hoặc một cơ chế khôi phục (ví dụ: một admin có thể trực tiếp thêm thành viên đầu tiên mà không cần bỏ phiếu nếu totalCapital == 0).

____________________________________________________________________________________
Tuyệt vời! Chúng ta sẽ xem xét lại logic của toàn bộ hệ thống smart contract với những cập nhật mới nhất, tập trung vào những thay đổi trong ItemsManagement, CompanyTreasuryManager và CustomerOrderManagement.
Tổng quan hệ thống (không đổi nhiều):
Hệ thống vẫn nhằm mục đích mô hình hóa hoạt động của một công ty bán lẻ, từ quản lý nhân sự, sản phẩm, tài chính, tồn kho, đến các quy trình đặt hàng ở nhiều cấp độ. Sự thay đổi chủ yếu tập trung vào việc phân quyền quản trị và cách thức xử lý một số nghiệp vụ cụ thể.
________________


1. RoleManagement.sol (Quản lý Vai trò - Logic không thay đổi đáng kể)
* Mục đích: Định nghĩa vai trò, quản lý thành viên Ban Giám Đốc (BĐH), và kiểm soát quyền truy cập dựa trên vai trò.
* Logic chính:
   * Ban Giám Đốc (BĐH - BOARD_ROLE): Có quyền cao nhất trong việc phê duyệt các quyết định chiến lược (thông qua cơ chế bỏ phiếu theo tỷ lệ cổ phần).
   * Giám đốc các bộ phận (..._DIRECTOR_ROLE): Được BĐH bổ nhiệm. Có quyền quản lý hoạt động của bộ phận mình và bổ nhiệm các Quản lý (..._MANAGER_ROLE) cấp dưới.
   * Nhà Cung Cấp (SUPPLIER_ROLE): Được BĐH cấp quyền sau khi thông tin của họ được đăng ký và phê duyệt trong SuppliersManagement. Vai trò này cho phép NCC tương tác với hệ thống (ví dụ: niêm yết sản phẩm).
   * DEFAULT_ADMIN_ROLE: Thường do người triển khai hợp đồng nắm giữ, dùng cho các thiết lập ban đầu hoặc các thay đổi cấu trúc hợp đồng (nếu có).
* ________________


2. ItemsBasicManagement.sol + SuppliersManagement.sol (Quản lý Mặt hàng và Địa điểm - Đã tách thành 2 contract)
* Mục đích: 
  - ItemsBasicManagement: Quản lý danh mục sản phẩm cơ bản, địa điểm (kho, cửa hàng), và giá bán lẻ.
  - SuppliersManagement: Quản lý nhà cung cấp và việc niêm yết sản phẩm của NCC.
* Logic chính (ĐÃ CẬP NHẬT):
   * Quản lý bởi Ban Điều Hành (BĐH - BOARD_ROLE):
      * Đề xuất và Phê duyệt (trong ItemsBasicManagement):
         * proposeNewItem, proposeNewPhysicalLocation: Bất kỳ thành viên BĐH nào cũng có thể đề xuất thêm mới mặt hàng, địa điểm (kho/cửa hàng). Thông tin được lưu nhưng chưa có hiệu lực (isApprovedByBoard = false).
         * approveProposedItem, approveProposedPhysicalLocation: Một thành viên BĐH khác có thể "chốt" việc phê duyệt bằng cách cung cấp danh sách các thành viên BĐH khác (_approvers) đồng ý. Nếu tổng tỷ lệ cổ phần của những người đồng ý > 50%, thực thể đó sẽ được đánh dấu isApprovedByBoard = true.
         * Khi phê duyệt mặt hàng (approveProposedItem), BĐH đồng thời đặt một referencePriceCeiling (giá trần tham khảo) cho mặt hàng đó.
      * Đề xuất và Phê duyệt Nhà cung cấp (trong SuppliersManagement):
         * proposeNewSupplier, approveProposedSupplier: Tương tự như trên cho việc quản lý nhà cung cấp.
      * Phê duyệt thủ công niêm yết của NCC (trong SuppliersManagement): Nếu NCC niêm yết sản phẩm với giá cao hơn referencePriceCeiling, BĐH cần dùng approveSupplierItemManuallyByBoard (với sự đồng thuận) để phê duyệt.   * Gán Quản lý Địa điểm (assignManagerToLocation trong ItemsBasicManagement):
      * Sau khi một Kho hoặc Cửa hàng được BĐH phê duyệt, người có vai trò WAREHOUSE_DIRECTOR_ROLE (Giám đốc Kho) hoặc STORE_DIRECTOR_ROLE (Giám đốc Cửa hàng) sẽ gọi hàm này để gán một địa chỉ ví làm manager (Quản lý Kho/Cửa hàng) cho địa điểm đó. Người được gán phải có vai trò ..._MANAGER_ROLE tương ứng từ RoleManagement.
   * Chức năng của Giám đốc Cửa hàng (STORE_DIRECTOR_ROLE trong ItemsBasicManagement):
      * setDesignatedSourceWarehouseForStore: Sau khi cửa hàng và kho đã được BĐH phê duyệt, bất kỳ người nào có STORE_DIRECTOR_ROLE đều có thể chỉ định một kho (đã được duyệt và là "WAREHOUSE") làm kho nguồn cung cấp hàng cho một cửa hàng (đã được duyệt và là "STORE").
      * setStoreItemRetailPrice: Bất kỳ người nào có STORE_DIRECTOR_ROLE đều có thể đặt giá bán lẻ cho một mặt hàng (đã được duyệt) tại một cửa hàng (đã được duyệt và là "STORE").
   * Nhà Cung Cấp (SUPPLIER_ROLE trong SuppliersManagement):
      * Được BĐH đề xuất và phê duyệt thông tin trong SuppliersManagement (qua proposeNewSupplier và approveProposedSupplier).
      * Quan trọng: Sau khi được phê duyệt trong SuppliersManagement, BĐH hoặc Admin hệ thống cần vào RoleManagement để cấp SUPPLIER_ROLE cho địa chỉ ví của NCC đó.
      * listSupplierItem: Khi đã có SUPPLIER_ROLE và thông tin được phê duyệt, NCC có thể niêm yết mặt hàng họ cung cấp.
         * Nếu giá niêm yết ≤ referencePriceCeiling của mặt hàng (từ ItemsBasicManagement), SupplierItemListing.isApprovedByBoard tự động là true.
         * Nếu giá > referencePriceCeiling, cần BĐH phê duyệt thủ công.
   * Giá cả:
      * Bỏ giá sỉ kho -> cửa hàng: Không còn warehouseItemWholesalePrices.
      * Giá bán lẻ do Giám đốc Cửa hàng đặt trong ItemsBasicManagement.
   * DEFAULT_ADMIN_ROLE: Chủ yếu cho người triển khai ban đầu, có thể không tham gia nhiều vào hoạt động nghiệp vụ hàng ngày sau khi BĐH đã nắm quyền.
* ________________


3. CompanyTreasuryManager.sol (Quản lý Ngân quỹ Công ty - Cập nhật)
* Mục đích: Quản lý dòng tiền tập trung, ký quỹ, thanh toán, và hoàn tiền.
* Logic chính (ĐÃ CẬP NHẬT):
   * Hoàn tiền cho khách hàng (refundCustomerOrderFromTreasury):
      * MỚI: Thêm hàm này, chỉ có thể được gọi bởi địa chỉ của hợp đồng CustomerOrderManagement (COM) đã được đăng ký.
      * Khi COM xác định cần hoàn tiền cho khách từ ngân quỹ (ví dụ, trường hợp khách trả lại đơn hàng đã hoàn thành và tiền đã chuyển về CTM), COM sẽ gọi hàm này.
      * CTM kiểm tra quyền của người gọi, số dư ngân quỹ và thực hiện chuyển tiền trực tiếp cho khách hàng. Phát sự kiện CustomerRefundProcessedFromTreasury.
   *    * generalWithdrawal: Vẫn giữ nguyên cho các mục đích chi tiêu chung khác của công ty, do Giám đốc Tài chính thực hiện.
   * Các logic khác về ký quỹ cho đơn hàng Kho-NCC, quản lý chính sách chi tiêu kho, chuyển tiền nội bộ vẫn giữ nguyên.
   * Owner cần đặt customerOrderManagementAddress sau khi triển khai.
* ________________


4. WarehouseInventoryManagement.sol (Quản lý Tồn kho Chính/Kho Trung Tâm - Logic không thay đổi đáng kể)
* Mục đích: Theo dõi tồn kho tại các kho trung tâm, xử lý hàng nhập từ NCC và hàng chuyển đi cửa hàng, hàng khách trả về kho.
* Logic chính:
   * Nhận hàng từ NCC thông qua lệnh gọi từ WarehouseSupplierOrderManagement.
   * Chuyển hàng đến cửa hàng khi nhận được yêu cầu từ StoreInventoryManagement (WIM sẽ trừ kho của mình và gọi lại SIM để SIM cộng kho cửa hàng).
   * Nhận hàng khách trả về kho thông qua lệnh gọi từ CustomerOrderManagement.
* ________________


5. StoreInventoryManagement.sol (Quản lý Tồn kho Cửa hàng - Logic không thay đổi đáng kể)
* Mục đích: Theo dõi tồn kho tại từng cửa hàng, yêu cầu hàng từ kho nguồn, ghi nhận hàng nhận và hàng bán.
* Logic chính:
   * Quản lý Cửa hàng (có STORE_MANAGER_ROLE và là manager của cửa hàng đó) gọi requestStockFromDesignatedWarehouse để yêu cầu hàng. SIM sẽ tìm kho nguồn đã được Giám đốc Cửa hàng chỉ định (trong ItemsBasicManagement) và gọi requestStockTransferToStore trên WarehouseInventoryManagement.
   * Nhận xác nhận và cập nhật tồn kho khi WarehouseInventoryManagement gọi confirmStockReceivedFromWarehouse.
   * Trừ tồn kho khi CustomerOrderManagement gọi deductStockForCustomerSale sau khi đơn hàng được giao thành công.
* ________________


6. WarehouseSupplierOrderManagement.sol (Quản lý Đơn hàng Kho - Nhà cung cấp - Logic không thay đổi đáng kể)
* Mục đích: Quản lý quy trình đặt hàng từ kho đến NCC, bao gồm ký quỹ và giải ngân.
* Logic chính:
   * Quản lý Kho đặt hàng, hệ thống kiểm tra thông tin NCC và mặt hàng (đã được BĐH phê duyệt trong ItemsBasicManagement và SuppliersManagement), kiểm tra chính sách chi tiêu từ CTM, và yêu cầu CTM ký quỹ.
   * NCC xác nhận giao hàng.
   * Kho xác nhận nhận hàng, yêu cầu CTM giải ngân cho NCC, và thông báo cho WarehouseInventoryManagement cập nhật tồn kho.
* ________________


7. CustomerOrderManagement.sol (Quản lý Đơn hàng Khách hàng - Cập nhật)
* Mục đích: Quản lý quy trình đặt hàng của khách, giữ tiền thanh toán, điều phối với cửa hàng, và xử lý hoàn tiền.
* Logic chính (ĐÃ CẬP NHẬT):
   * Đặt hàng: Khách hàng chọn cửa hàng, mặt hàng. COM lấy giá bán lẻ (do Giám đốc Cửa hàng đặt trong ItemsBasicManagement). Khách thanh toán, COM giữ tiền.
   * Cửa hàng xử lý: Quản lý Cửa hàng cập nhật trạng thái các mặt hàng trong đơn (có sẵn, cần bổ sung, sẵn sàng giao).
   * Giao hàng và Hoàn thành:
      * Cửa hàng xác nhận giao hàng, COM gọi StoreInventoryManagement để trừ tồn kho cửa hàng.
      * Khách hàng xác nhận nhận hàng, COM chuyển tiền đang giữ cho CompanyTreasuryManager.
   *    * Hủy đơn hàng (trước khi tiền vào Ngân quỹ):
      * Nếu đơn hàng bị hủy bởi cửa hàng hoặc khách hàng trước khi tiền được chuyển cho CTM, COM sẽ tự trích tiền đang giữ để hoàn 100% cho khách.
   *    * Trả hàng sau khi hoàn thành (customerReturnOrderAfterReceipt - ĐÃ CẬP NHẬT):
      * Khách hàng yêu cầu trả hàng cho một đơn đã Completed (tiền đã được chuyển vào CTM).
      * COM thông báo cho WarehouseInventoryManagement để ghi nhận hàng trả về kho.
      * COM tính toán 90% giá trị đơn hàng và gọi hàm refundCustomerOrderFromTreasury trên CompanyTreasuryManager (địa chỉ CTM được lưu trong COM). CTM sẽ thực hiện việc hoàn tiền từ ngân quỹ cho khách hàng.
   *    * emergencyWithdraw: Tiền khẩn cấp rút từ COM sẽ được chuyển về companyTreasuryAddress.
* Luồng chính đã thay đổi:
* Quyền quản trị trong ItemsBasicManagement và SuppliersManagement: Chuyển từ Admin sang Ban Điều Hành với cơ chế bỏ phiếu theo cổ phần cho các quyết định thêm mới và phê duyệt quan trọng. Các Giám đốc bộ phận có quyền thực thi trong phạm vi của mình (gán quản lý, đặt giá, chỉ định kho nguồn).
* Hoàn tiền khi trả hàng: Nếu đơn hàng đã hoàn tất và tiền đã vào ngân quỹ (CTM), việc hoàn tiền cho khách (90%) khi họ trả hàng sẽ do COM yêu cầu và CTM thực hiện từ ngân quỹ trung tâm, thay vì COM tự xử lý.
Những thay đổi này làm cho hệ thống linh hoạt hơn trong việc phân quyền cấp cao, đồng thời đảm bảo các quy trình tài chính phức tạp như hoàn tiền từ ngân quỹ được xử lý một cách có kiểm soát.

____________________________________________________________________________________
THAY ĐỔI KIẾN TRÚC QUAN TRỌNG:

** TÁCH CONTRACT ITEMSMANAGEMENT **
Do vấn đề kích thước contract ItemsManagement.sol gốc vượt quá 24576 bytes (giới hạn của Ethereum), contract đã được tách thành 2 contract nhỏ hơn:

1. **ItemsBasicManagement.sol**:
   - Quản lý thông tin cơ bản về mặt hàng (items)
   - Quản lý địa điểm vật lý (kho, cửa hàng)
   - Quản lý giá bán lẻ tại cửa hàng
   - Gán manager cho các địa điểm
   - Chỉ định kho nguồn cho cửa hàng

2. **SuppliersManagement.sol**:
   - Quản lý thông tin nhà cung cấp (suppliers)
   - Quản lý việc niêm yết sản phẩm của NCC
   - Phê duyệt niêm yết sản phẩm với giá cả
   - Tham chiếu đến ItemsBasicManagement để lấy thông tin mặt hàng

** CÁC THAY ĐỔI LIÊN QUAN **:
- Cập nhật tất cả migration files theo thứ tự deploy mới
- Cập nhật các contract khác để sử dụng interface mới
- CompanyTreasuryManager giờ tham chiếu đến cả 2 contract
- WarehouseSupplierOrderManagement sử dụng cả 2 contract
- Các contract khác chỉ cần ItemsBasicManagement

** LỢI ÍCH **:
- Giải quyết vấn đề deploy contract quá lớn
- Tách biệt trách nhiệm rõ ràng hơn
- Dễ bảo trì và nâng cấp
- Giữ nguyên toàn bộ chức năng của hệ thống gốc