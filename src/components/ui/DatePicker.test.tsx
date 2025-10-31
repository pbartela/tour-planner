// @ts-nocheck
// Test file - excluded from TypeScript checking since test infrastructure isn't set up
import { render, screen, fireEvent } from "@testing-library/react";
import { DatePicker } from "./DatePicker";
import { DateRangePicker } from "./DateRangePicker";
import { DaisyCalendar } from "./DaisyCalendar";

// Mock the calendar components for testing
jest.mock("react-day-picker", () => ({
  ...jest.requireActual("react-day-picker"),
  DayPicker: ({ onSelect }: { onSelect?: (date: Date) => void }) => (
    <div
      data-testid="calendar"
      onClick={() => onSelect?.(new Date("2024-12-25"))}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(new Date("2024-12-25"))}
      role="button"
      tabIndex={0}
    >
      Calendar Component
    </div>
  ),
}));

describe("DatePicker", () => {
  it("renders with placeholder text", () => {
    render(<DatePicker placeholder="Pick a date" />);
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
  });

  it("renders with selected date", () => {
    const testDate = new Date("2024-12-25");
    render(<DatePicker value={testDate} />);
    expect(screen.getByText("December 25, 2024")).toBeInTheDocument();
  });

  it("calls onChange when date is selected", () => {
    const handleChange = jest.fn();
    render(<DatePicker onChange={handleChange} />);

    // Click to open calendar
    fireEvent.click(screen.getByRole("combobox"));

    // Click on calendar to select date
    fireEvent.click(screen.getByTestId("calendar"));

    expect(handleChange).toHaveBeenCalledWith(expect.any(Date));
  });

  it("applies correct variant classes", () => {
    render(<DatePicker variant="primary" />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveClass("input-primary");
  });

  it("applies correct size classes", () => {
    render(<DatePicker size="lg" />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveClass("input-lg");
  });

  it("is disabled when disabled prop is true", () => {
    render(<DatePicker disabled />);
    const button = screen.getByRole("combobox");
    expect(button).toBeDisabled();
  });

  it("has correct accessibility attributes", () => {
    render(<DatePicker aria-label="Select date" aria-describedby="date-help" required />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveAttribute("aria-label", "Select date");
    expect(button).toHaveAttribute("aria-describedby", "date-help");
    expect(button).toHaveAttribute("aria-required", "true");
  });
});

describe("DateRangePicker", () => {
  it("renders with placeholder text", () => {
    render(<DateRangePicker placeholder="Pick a date range" />);
    expect(screen.getByText("Pick a date range")).toBeInTheDocument();
  });

  it("renders with selected date range", () => {
    const testRange = {
      from: new Date("2024-12-20"),
      to: new Date("2024-12-25"),
    };
    render(<DateRangePicker value={testRange} />);
    expect(screen.getByText("Dec 20 - Dec 25, 2024")).toBeInTheDocument();
  });

  it("calls onChange when date range is selected", () => {
    const handleChange = jest.fn();
    render(<DateRangePicker onChange={handleChange} />);

    // Click to open calendar
    fireEvent.click(screen.getByRole("combobox"));

    // Click on calendar to select date
    fireEvent.click(screen.getByTestId("calendar"));

    expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
  });
});

describe("DaisyCalendar", () => {
  it("renders calendar component", () => {
    render(<DaisyCalendar />);
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
  });

  it("applies correct variant classes", () => {
    render(<DaisyCalendar variant="bordered" />);
    const calendar = screen.getByTestId("calendar");
    expect(calendar).toHaveClass("card-border");
  });

  it("applies correct size classes", () => {
    render(<DaisyCalendar size="lg" />);
    const calendar = screen.getByTestId("calendar");
    expect(calendar).toHaveClass("card-lg");
  });

  it("calls onSelect when date is selected", () => {
    const handleSelect = jest.fn();
    render(<DaisyCalendar onSelect={handleSelect} />);

    // Click on calendar to select date
    fireEvent.click(screen.getByTestId("calendar"));

    expect(handleSelect).toHaveBeenCalledWith(expect.any(Date));
  });
});





