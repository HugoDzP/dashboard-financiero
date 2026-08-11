import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Footer from "../components/Footer.jsx";

describe("Footer", () => {
  it("muestra el crédito del proyecto", () => {
    render(<Footer />);
    expect(
      screen.getByText(/construido con flask \+ postgresql/i)
    ).toBeInTheDocument();
  });
});
