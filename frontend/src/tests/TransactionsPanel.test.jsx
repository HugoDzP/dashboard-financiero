import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TransactionsPanel from "../components/TransactionsPanel.jsx";
import client from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

function fillCommonFields() {
  fireEvent.change(screen.getByPlaceholderText("Concepto"), {
    target: { value: "Mercadona" },
  });
  fireEvent.change(screen.getByPlaceholderText("Importe"), {
    target: { value: "45.30" },
  });
}

describe("TransactionsPanel", () => {
  beforeEach(() => {
    client.post.mockClear();
  });

  it("envía el importe en negativo cuando el tipo es Gasto (por defecto)", async () => {
    render(<TransactionsPanel transactions={[]} onChanged={() => {}} />);
    fillCommonFields();
    fireEvent.click(screen.getByRole("button", { name: /añadir movimiento/i }));

    await waitFor(() => expect(client.post).toHaveBeenCalledTimes(1));
    const [, body] = client.post.mock.calls[0];
    expect(body.amount).toBe(-45.3);
  });

  it("envía el importe en positivo cuando se elige Ingreso", async () => {
    render(<TransactionsPanel transactions={[]} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /^ingreso$/i }));
    fillCommonFields();
    fireEvent.click(screen.getByRole("button", { name: /añadir movimiento/i }));

    await waitFor(() => expect(client.post).toHaveBeenCalledTimes(1));
    const [, body] = client.post.mock.calls[0];
    expect(body.amount).toBe(45.3);
  });

  it("muestra el mensaje de vacío cuando no hay movimientos", () => {
    render(<TransactionsPanel transactions={[]} onChanged={() => {}} />);
    expect(screen.getByText(/no hay movimientos todavía/i)).toBeInTheDocument();
  });
});
