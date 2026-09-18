// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "./LoadingScreen";

describe("LoadingScreen", () => {
  it("shows the thinking message", () => {
    render(<LoadingScreen />);
    expect(
      screen.getByText("AI đang suy nghĩ kỹ lắm rồi, chờ xíu nha!")
    ).toBeInTheDocument();
  });
});
