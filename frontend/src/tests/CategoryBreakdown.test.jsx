import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CategoryBreakdown from "../components/CategoryBreakdown.jsx";

describe("CategoryBreakdown", () => {
  it("muestra un mensaje cuando no hay categorías", () => {
    render(<CategoryBreakdown categories={[]} />);
    expect(screen.getByText(/no hay gastos categorizados/i)).toBeInTheDocument();
  });

  it("lista cada categoría con su importe", () => {
    render(
      <CategoryBreakdown
        categories={[
          { category: "alimentación", amount: 120.5 },
          { category: "transporte", amount: 45 },
        ]}
      />
    );
    expect(screen.getByText("alimentación")).toBeInTheDocument();
    expect(screen.getByText("transporte")).toBeInTheDocument();
  });
});
