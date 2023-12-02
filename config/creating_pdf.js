require('dotenv').config();
const fs = require('fs');
const Inventory = require('../models/inventory');

const AWS = require("aws-sdk");

const PDFDocument = require('pdfkit');

class PDFDocumentWithTables extends PDFDocument {
    constructor(options) {
        super(options);
    }

    table(table, arg0, arg1, arg2) {
        let startX = this.page.margins.left, startY = this.y;
        let options = {};

        if ((typeof arg0 === 'number') && (typeof arg1 === 'number')) {
            startX = arg0;
            startY = arg1;

            if (typeof arg2 === 'object')
                options = arg2;
        } else if (typeof arg0 === 'object') {
            options = arg0;
        }

        const columnCount = table.headers.length;
        const columnSpacing = options.columnSpacing || 15;
        const rowSpacing = options.rowSpacing || 5;
        const usableWidth = options.width || (this.page.width - this.page.margins.left - this.page.margins.right);

        const prepareHeader = options.prepareHeader || (() => { });
        const prepareRow = options.prepareRow || (() => { });
        const computeRowHeight = (row) => {
            let result = 0;

            row.forEach((cell) => {
                const cellHeight = this.heightOfString(cell, {
                    width: columnWidth,
                    align: 'left'
                });
                result = Math.max(result, cellHeight);
            });

            return result + rowSpacing;
        };

        const columnContainerWidth = usableWidth / columnCount;
        const columnWidth = columnContainerWidth - columnSpacing;
        const maxY = this.page.height - this.page.margins.bottom;

        let rowBottomY = 0;

        this.on('pageAdded', () => {
            startY = this.page.margins.top;
            rowBottomY = 0;
        });

        // Allow the user to override style for headers
        prepareHeader();

        // Check to have enough room for header and first rows
        if (startY + 3 * computeRowHeight(table.headers) > maxY)
            this.addPage();

        // Print all headers
        table.headers.forEach((header, i) => {
            this.font("Courier-Bold").fontSize(10).text(header, startX + i * columnContainerWidth, startY, {
                width: columnWidth,
                align: 'left'
            });
        });

        // Refresh the y coordinate of the bottom of the headers row
        rowBottomY = Math.max(startY + computeRowHeight(table.headers), rowBottomY);

        // Separation line between headers and rows
        this.moveTo(startX, rowBottomY - rowSpacing * 0.5)
            .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
            .lineWidth(2)
            .stroke();

        table.rows.forEach((row, i) => {
            const rowHeight = computeRowHeight(row);

            // Switch to next page if we cannot go any further because the space is over.
            // For safety, consider 3 rows margin instead of just one
            if (startY + 3 * rowHeight < maxY)
                startY = rowBottomY + rowSpacing;
            else
                this.addPage();

            // Allow the user to override style for rows
            prepareRow(row, i);

            // Print all cells of the current row
            row.forEach((cell, i) => {
                this.text(cell, startX + i * columnContainerWidth, startY, {
                    width: columnWidth,
                    align: 'left'
                });
            });

            // Refresh the y coordinate of the bottom of this row
            rowBottomY = Math.max(startY + rowHeight, rowBottomY);

            // Separation line between rows
            this.moveTo(startX, rowBottomY - rowSpacing * 0.5)
                .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
                .lineWidth(1)
                .opacity(0.7)
                .stroke()
                .opacity(1); // Reset opacity after drawing the line
        });

        this.x = startX;
        this.moveDown();

        return this;
    }
}


async function createSellInfoPDF(info) {
    try {
        const s3 = new AWS.S3();

        const doc = new PDFDocumentWithTables();
        const chunks = [];

        doc.on('data', (chunk) => {
            chunks.push(chunk);
        });

        doc.on('end', async () => {
            // Concatenate all the chunks into a Buffer
            const pdfBuffer = Buffer.concat(chunks);

            const pdfFilePath = `sell_info_${info.userid}.pdf`;
            const s3Params = {
                Bucket: process.env.BUCKET, // Replace with your S3 bucket name
                Key: pdfFilePath,
                Body: pdfBuffer,
                ContentType: 'application/pdf',
            };

            // Upload the PDF to AWS S3
            await s3.upload(s3Params).promise();

            console.log(`PDF uploaded successfully to S3: ${pdfFilePath}`);

            // Optionally, you can delete the local file if it's no longer needed
            // fs.unlinkSync(pdfFilePath);
        });
        doc
            .fontSize(20)
            .text(`${process.env.HOSPITAL_NAME}`, 100, 15, { align: "center" })
            .text("Customer Invoice", 100, 35, { align: "center" })
            .fontSize(10)
            .text(`Name: ${info.name}`, 50, 65, { align: "left" })
            .text(`Mobile: ${info.mobile}`, 50, 75, { align: "left" })
            .text(`Email: ${info.email}`, 50, 85, { align: "left" })
            .text(`Address: ${info.address}`, 50, 95, { align: "left" })
            .text(`Prescribed By:${info.doctor}`, 50, 105, { align: "left" })
            .text(`Sell By:${info.staff}`, 50, 115, { align: "left" })
            .text(`Payment Mode:${info.payment}`, 50, 125, { align: "left" })
            .fontSize(10)
            .text(`${process.env.HOSPITAL_ADDRESS}`, 200, 65, { align: "right" })
            .text(`${process.env.HOSPITAL_MOBILE}`, 200, 75, { align: "right" })
            .text(`${process.env.HOSPITAL_EMAIL}`, 200, 85, { align: "right" })
            .text(`${process.env.WEBSITE}, `, 200, 95, { align: "right" })
            .text(`Gst: ${process.env.GST_NUMBER}`, 200, 105, { align: "right" })
            .moveDown();

        const table = {
            headers: ['Sno.', 'M-ID', 'Name', 'Unit', 'Cost(Rs.)', 'Discount(%)', 'GST(%)', 'Amount(Rs.)'],
            rows: []
        };
        let x = 1;
        let totalAmount = 0;
        for (let i = 0; i < info.medicineIds.length; i++) {
            const data = await Inventory.findOne({ medicine_id: info.medicineIds[i] });

            if (data) {
                const costEach = data.price;
                const unit = info.stocks[i];
                let discount = data.discount / 100;
                discount = parseFloat(discount.toFixed(2))
                let gst = data.gst / 100;
                gst = parseFloat(gst.toFixed(2))
                let amount = costEach * unit;
                let amt = amount;
                if (discount > 0) {
                    amt -= amount * discount;
                }
                if (gst > 0) {
                    amt += amount * gst;
                }
                amount = amt;
                // Round off amount to two decimal places
                const roundedAmount = parseFloat(amount.toFixed(2));
                table.rows.push([x, data.medicine_id, data.name, unit.toString(), costEach.toString(), data.discount, data.gst, roundedAmount.toString()])

                totalAmount += amount;
                x++;
            }
        }
        doc.moveDown().table(table, 10, 150, { width: 590 });
        doc.moveTo(10, 135 + table.rows.length * 20 + 50).lineTo(600, 135 + table.rows.length * 20 + 50).stroke();
        const roundedTotalAmount = parseFloat(totalAmount.toFixed(2));
        doc.fontSize(14).text(`Grand Total: Rs. ${roundedTotalAmount}`, 50, 135 + table.rows.length * 20 + 80, { align: "right" });
        // writeStream.on('finish', () => {
        //     console.log(`PDF created successfully: ${pdfFilePath}`);
        // });

        // writeStream.on('error', (error) => {
        //     console.error('Error writing PDF file:', error);
        // });
        doc.end();
    } catch (error) {
        console.error('Error creating PDF:', error);
    }
}
module.exports = createSellInfoPDF;