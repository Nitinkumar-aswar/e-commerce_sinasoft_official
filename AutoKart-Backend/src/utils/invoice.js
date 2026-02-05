const PDFDocument = require("pdfkit");

function generateInvoicePDF(res, order, items, totalAmount) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice-${order.order_id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("AutoKart Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Order ID: ${order.order_id}`);
  doc.text(`Order Date: ${new Date(order.created_at).toDateString()}`);
  doc.text(`Payment Method: ${order.payment_method}`);
  doc.moveDown();

  doc.fontSize(12).text("Delivery Address:", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).text(order.full_name);
  doc.text(order.address_type);
  doc.text(
    `${order.address_line}, ${order.city}, ${order.state} - ${order.pincode}`
  );
  doc.text(`Phone: ${order.mobile}`);

  doc.moveDown();
  doc.fontSize(14).text("Order Items:");
  doc.moveDown(0.5);

  items.forEach(item => {
    doc.fontSize(12).text(
      `${item.product_name} | ₹${item.price} x ${item.quantity} = ₹${(
        item.price * item.quantity
      ).toFixed(2)}`
    );
  });

  doc.moveDown();
  doc.fontSize(14).text(`Total Amount: ₹${totalAmount.toFixed(2)}`);

  doc.moveDown();
  doc.fontSize(10).text(
    "This is a computer-generated invoice.",
    { align: "center" }
  );

  doc.end();
}

module.exports = generateInvoicePDF;
