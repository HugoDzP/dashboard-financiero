import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatCard from "../components/StatCard.jsx";

describe("StatCard", () => {
  it("muestra la etiqueta y el valor", () => {
    render(<StatCard label="Ingresos" value="1.500,00 €" />);
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("1.500,00 €")).toBeInTheDocument();
  });

  it("muestra el hint cuando se pasa", () => {
    render(<StatCard label="Cartera" value="0 €" hint="coste: 0 €" />);
    expect(screen.getByText("coste: 0 €")).toBeInTheDocument();
  });
});
