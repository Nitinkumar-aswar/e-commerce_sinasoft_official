const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/* -------- amount formatter -------- */
function money(val) {
  return Number(String(val).replace(/[^0-9.]/g, "")).toFixed(2);
}

function generateInvoicePDF(res, order, items, totalAmount) {
  const doc = new PDFDocument({ size: "A4", margin: 45 });

  totalAmount = Number(money(totalAmount));

  /* Theme */
  const PRIMARY = "#b87a4b";
  const PAGE_BG = "#faf6f2";
  const HEADER_BG = "#f6efe9";
  const BOX_BG = "#faf6f2";
  const TEXT = "#2f2f2f";
  const MUTED = "#8a8a8a";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice-${order.order_id}.pdf`
  );

  doc.pipe(res);

  /* ================= PAGE BACKGROUND ================= */
  doc.rect(0, 0, 612, 792).fill(PAGE_BG);

  /* ================= HEADER ================= */
  doc.rect(0, 0, 612, 125).fill(HEADER_BG);

  /* Logo */
  const logoPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "AutoKart-Frontend",
    "public",
    "uploads",
    "autokart_logo.jpeg"
  );

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 45, 35, { width: 110 });
  }

  /* Company info */
  doc
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("AUTOKART STORE", 170, 38);

  doc
    .font("Helvetica")
    .fontSize(10)
    .text("AutoKart Ecommerce Pvt Ltd", 170, 66)
    .text("Pune, Maharashtra", 170, 82)
    .text("Phone: +91 9876543210", 170, 98);

  /* Invoice meta */
  doc
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("INVOICE", 420, 42, { align: "right" });

  doc
    .fillColor(TEXT)
    .font("Helvetica")
    .fontSize(10)
    .text(`Invoice #: ${order.order_id}`, 420, 70, { align: "right" })
    .text(`Date: ${new Date(order.created_at).toDateString()}`, {
      align: "right"
    })
    .text(`Payment: ${order.payment_method}`, { align: "right" });

  doc.moveDown(3);

  /* ================= BILL TO ================= */
  const billTop = doc.y;

  doc.rect(45, billTop, 255, 110).fillAndStroke("white", PRIMARY);

  doc
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Bill To", 55, billTop + 12);

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(
      `${order.full_name}
${order.address_type}
${order.address_line}, ${order.city}, ${order.state} - ${order.pincode}
Phone: ${order.mobile}`,
      55,
      billTop + 34,
      { width: 235, lineGap: 3 }
    );

  /* ================= ORDER SUMMARY ================= */
  const summaryX = 330;
  const summaryY = billTop;

  doc.rect(summaryX, summaryY, 235, 110).fillAndStroke("white", PRIMARY);

  doc
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Order Summary", summaryX + 10, summaryY + 12);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(`Total Items: ${items.length}`, summaryX + 10, summaryY + 34)
    .text(`Order ID: ${order.order_id}`, summaryX + 10, summaryY + 50)
    .text(`Payment Mode: ${order.payment_method}`, summaryX + 10, summaryY + 66);

  doc
    .moveTo(45, billTop + 135)
    .lineTo(567, billTop + 135)
    .strokeColor("#e0d6ce")
    .stroke();

  doc.moveDown(4);

  /* ================= TABLE HEADER ================= */
  const tableTop = doc.y;

  doc.rect(45, tableTop, 522, 24).fill(PRIMARY);

  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("QTY", 55, tableTop + 6)
    .text("Description", 105, tableTop + 6)
    .text("Unit Price", 360, tableTop + 6, { width: 80, align: "right" })
    .text("Amount", 460, tableTop + 6, { width: 90, align: "right" });

  /* ================= ITEMS ================= */
  let y = tableTop + 32;

  doc.fillColor(TEXT).font("Helvetica").fontSize(10);

  items.forEach(item => {
    const price = Number(money(item.price));
    const qty = Number(item.quantity);
    const amount = price * qty;

    doc
      .text(qty, 55, y)
      .text(item.product_name, 105, y, { width: 235 })
      .text(`Rs. ${price.toFixed(2)}`, 360, y, {
        width: 80,
        align: "right"
      })
      .text(`Rs. ${amount.toFixed(2)}`, 460, y, {
        width: 90,
        align: "right"
      });

    doc
      .moveTo(45, y + 18)
      .lineTo(567, y + 18)
      .strokeColor("#e0d6ce")
      .stroke();

    y += 28;
  });

  /* ================= TOTAL ================= */
  y += 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(PRIMARY)
    .text("Total", 360, y)
    .text(`Rs. ${money(totalAmount)}`, 460, y, {
      width: 90,
      align: "right"
    });

  /* ================= FOOTER ================= */
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      "Thank you for shopping with AutoKart • This is a computer-generated invoice.",
      0,
      770,
      { align: "center" }
    );

  doc.end();
}

module.exports = generateInvoicePDF;
