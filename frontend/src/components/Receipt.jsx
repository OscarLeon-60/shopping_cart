import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

const COMPANY = {
    name: "ShopCart",
    nit: "123456789-0",
    address: "Avenida Siempre Viva 123",
    phone: "3100000000",
    email: "clientes@shopcart.com",
};

export default function Receipt({ data, onClose }) {
    const printRef = useRef();

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open("", "_blank");
        win.document.write(`
      <html>
        <head>
          <title>Factura ${data.order.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px; }
            .qr { display: flex; justify-content: center; margin: 8px 0; }
            .small { font-size: 10px; color: #555; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    };

    const qrData = JSON.stringify({
        factura: data.order.invoice_number,
        fecha: new Date(data.order.created_at).toLocaleDateString("es-CO"),
        total: data.total,
        empresa: COMPANY.nit,
    });

    const formatCOP = (val) =>
        parseFloat(val).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-black bg-opacity-40 absolute inset-0" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-xl z-10 w-full max-w-sm flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">🧾 Tirilla POS</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                {/* Tirilla con scroll */}
                <div className="flex-1 overflow-y-auto px-6 pb-2">
                <div
                    ref={printRef}
                    className="font-mono text-xs bg-white border border-dashed border-gray-300 rounded-xl p-4"
                >
                    {/* Encabezado empresa */}
                    <div className="center bold text-sm">{COMPANY.name}</div>
                    <div className="center">NIT: {COMPANY.nit}</div>
                    <div className="center">{COMPANY.address}</div>
                    <div className="center">Tel: {COMPANY.phone}</div>
                    <div className="center">{COMPANY.email}</div>

                    <div className="divider" />

                    {/* Factura */}
                    <div className="center bold">FACTURA DE VENTA POS</div>
                    <div className="center">No. {data.order.invoice_number}</div>
                    <div className="center">
                        {new Date(data.order.created_at).toLocaleString("es-CO")}
                    </div>

                    <div className="divider" />

                    {/* Cliente */}
                    <div className="bold">CLIENTE:</div>
                    <div>{data.client?.name || "Consumidor Final"}</div>
                    {data.client?.cedula && <div>CC: {data.client.cedula}</div>}
                    {data.client?.phone && <div>Tel: {data.client.phone}</div>}
                    {data.client?.email && <div>{data.client.email}</div>}

                    <div className="divider" />

                    {/* Empleado */}
                    <div className="bold">VENDEDOR:</div>
                    <div>{data.employee?.name || "—"}</div>

                    <div className="divider" />

                    {/* Items */}
                    <div className="bold">PRODUCTOS:</div>
                    <div className="row small bold">
                        <span>Descripción</span>
                        <span>Cant</span>
                        <span>Total</span>
                    </div>
                    <div className="divider" />

                    {data.items.map((item, i) => (
                        <div key={i}>
                            <div className="bold">{item.name}</div>
                            <div className="row">
                                <span>{formatCOP(item.price)} c/u</span>
                                <span>x{item.quantity}</span>
                                <span>{formatCOP(item.subtotal)}</span>
                            </div>
                        </div>
                    ))}

                    <div className="divider" />

                    {/* Total */}
                    <div className="total-row">
                        <span>TOTAL:</span>
                        <span>{formatCOP(data.total)}</span>
                    </div>

                    <div className="divider" />

                    {/* QR */}
                    <div className="qr">
                        <QRCodeSVG value={qrData} size={80} />
                    </div>

                    <div className="divider" />
                    <div className="center bold">¡Gracias por su compra!</div>
                    <div className="center small">Conserve este documento</div>
                </div>
                </div>{/* fin scroll */}

                {/* Botones fijos abajo */}
                <div className="flex gap-3 px-6 py-4 border-t shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold transition"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
}