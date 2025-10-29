import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { DaisyCalendar } from "./DaisyCalendar";
import { useState } from "react";

const meta = {
  title: "Components/UI/DateComponents",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: function Render() {
    const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
    
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Date Components Overview</h1>
          <p className="text-base-content/70">
            A comprehensive collection of date picker components built with shadcn/ui and styled with daisyUI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DatePicker Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">DatePicker</h2>
            <p className="text-base-content/70">
              Single date selection with popover calendar.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Select a date</span>
                </label>
                <DatePicker
                  value={singleDate}
                  onChange={setSingleDate}
                  placeholder="Pick a date"
                  variant="primary"
                  size="md"
                />
              </div>
              
              <div className="text-sm text-base-content/70">
                Selected: {singleDate ? singleDate.toLocaleDateString() : "None"}
              </div>
            </div>
          </div>

          {/* DateRangePicker Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">DateRangePicker</h2>
            <p className="text-base-content/70">
              Date range selection with dual-month calendar.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Select a date range</span>
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Pick a date range"
                  variant="secondary"
                  size="md"
                />
              </div>
              
              <div className="text-sm text-base-content/70">
                Selected: {dateRange?.from ? dateRange.from.toLocaleDateString() : "None"} 
                {dateRange?.to && ` - ${dateRange.to.toLocaleDateString()}`}
              </div>
            </div>
          </div>
        </div>

        {/* DaisyCalendar Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">DaisyCalendar</h2>
          <p className="text-base-content/70">
            Standalone calendar component with daisyUI styling.
          </p>
          
          <div className="flex justify-center">
            <DaisyCalendar
              selected={calendarDate}
              onSelect={setCalendarDate}
              variant="bordered"
              size="lg"
              buttonVariant="primary"
            />
          </div>
          
          <div className="text-sm text-base-content/70 text-center">
            Selected: {calendarDate ? calendarDate.toLocaleDateString() : "None"}
          </div>
        </div>

        {/* Variants Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">All Variants</h2>
          <p className="text-base-content/70">
            Different color variants and sizes available.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Primary</h3>
              <DatePicker variant="primary" placeholder="Primary variant" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Secondary</h3>
              <DatePicker variant="secondary" placeholder="Secondary variant" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Accent</h3>
              <DatePicker variant="accent" placeholder="Accent variant" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Success</h3>
              <DatePicker variant="success" placeholder="Success variant" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Warning</h3>
              <DatePicker variant="warning" placeholder="Warning variant" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Error</h3>
              <DatePicker variant="error" placeholder="Error variant" />
            </div>
          </div>
        </div>

        {/* Sizes Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">All Sizes</h2>
          <p className="text-base-content/70">
            Different size variants from extra small to extra large.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Extra Small</h3>
              <DatePicker size="xs" placeholder="Extra small" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Small</h3>
              <DatePicker size="sm" placeholder="Small" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Medium (Default)</h3>
              <DatePicker size="md" placeholder="Medium" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Large</h3>
              <DatePicker size="lg" placeholder="Large" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Extra Large</h3>
              <DatePicker size="xl" placeholder="Extra large" />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: function Render() {
    const [formData, setFormData] = useState({
      startDate: undefined as Date | undefined,
      endDate: undefined as DateRange | undefined,
      eventDate: undefined as Date | undefined,
    });
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Form submitted with:
        Start Date: ${formData.startDate?.toLocaleDateString() || "None"}
        Date Range: ${formData.endDate?.from?.toLocaleDateString() || "None"}${formData.endDate?.to ? ` - ${formData.endDate.to.toLocaleDateString()}` : ""}
        Event Date: ${formData.eventDate?.toLocaleDateString() || "None"}`);
    };
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Event Planning Form</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="start-date" className="label">
              <span className="label-text">Event Start Date</span>
              <span className="label-text-alt text-error">*</span>
            </label>
            <DatePicker
              id="start-date"
              name="startDate"
              value={formData.startDate}
              onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
              placeholder="Select start date"
              variant="primary"
              size="md"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date-range" className="label">
              <span className="label-text">Event Duration</span>
            </label>
            <DateRangePicker
              id="date-range"
              name="dateRange"
              value={formData.endDate}
              onChange={(range) => setFormData(prev => ({ ...prev, endDate: range }))}
              placeholder="Select date range"
              variant="secondary"
              size="md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="event-date" className="label">
              <span className="label-text">Special Event Date</span>
            </label>
            <DatePicker
              id="event-date"
              name="eventDate"
              value={formData.eventDate}
              onChange={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
              placeholder="Select special date"
              variant="accent"
              size="md"
            />
          </div>
          
          <div className="flex gap-4">
            <button type="submit" className="btn btn-primary">
              Submit Event
            </button>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => setFormData({ startDate: undefined, endDate: undefined, eventDate: undefined })}
            >
              Clear All
            </button>
          </div>
        </form>
      </div>
    );
  },
};

