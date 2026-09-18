// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackBlock } from "./FeedbackBlock";

describe("FeedbackBlock", () => {
  it("shows a thank-you message after clicking the positive option", async () => {
    const user = userEvent.setup();
    render(<FeedbackBlock />);

    await user.click(screen.getByRole("button", { name: /Thông tin hữu ích/ }));

    expect(screen.getByText("Cảm ơn bạn đã phản hồi!")).toBeInTheDocument();
  });

  it("shows an optional comment box after clicking the negative option, without forcing input", async () => {
    const user = userEvent.setup();
    render(<FeedbackBlock />);

    await user.click(screen.getByRole("button", { name: /Có gì đó chưa ổn/ }));

    expect(
      screen.getByPlaceholderText(/Ví dụ: thông tin lương chưa chính xác/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bỏ qua" }));

    expect(screen.getByText("Cảm ơn bạn đã phản hồi!")).toBeInTheDocument();
  });

  it("submits the optional comment and shows the thank-you message", async () => {
    const user = userEvent.setup();
    render(<FeedbackBlock />);

    await user.click(screen.getByRole("button", { name: /Có gì đó chưa ổn/ }));
    await user.type(
      screen.getByPlaceholderText(/Ví dụ: thông tin lương chưa chính xác/),
      "Mức lương ghi sai"
    );
    await user.click(screen.getByRole("button", { name: "Gửi góp ý" }));

    expect(screen.getByText("Cảm ơn bạn đã phản hồi!")).toBeInTheDocument();
  });
});
