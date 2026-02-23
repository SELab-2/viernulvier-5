import { render, screen } from "@testing-library/react";

function SmokeComponent() {
  return <h1>Jest setup works</h1>;
}

it("renders a smoke heading", () => {
  render(<SmokeComponent />);

  expect(
    screen.getByRole("heading", { name: /jest setup works/i }),
  ).toBeInTheDocument();
});
