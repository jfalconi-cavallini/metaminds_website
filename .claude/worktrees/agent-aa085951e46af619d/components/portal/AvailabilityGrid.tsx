import type { TutorAvailability } from "@/lib/portal/types";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  slots: TutorAvailability[];
  onRemove?: (index: number) => void; // if provided, renders remove buttons (tutor editor mode)
}

export default function AvailabilityGrid({ slots, onRemove }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAY_SHORT.map((day, i) => {
        const daySlots = slots
          .map((s, originalIdx) => ({ ...s, originalIdx }))
          .filter((s) => s.dayOfWeek === i);

        return (
          <div key={i} className="flex flex-col items-center min-w-0">
            <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{day}</p>
            {daySlots.length > 0 ? (
              <div className="w-full space-y-1">
                {daySlots.map((slot) => (
                  <div
                    key={slot.originalIdx}
                    className="bg-blue-50 border border-blue-200 rounded-lg px-1 py-2 text-center relative group"
                  >
                    <p className="text-xs font-semibold text-blue-700 leading-tight">{slot.startTime}</p>
                    <div className="w-3 h-px bg-blue-300 mx-auto my-1" />
                    <p className="text-xs font-semibold text-blue-700 leading-tight">{slot.endTime}</p>
                    {onRemove && (
                      <button
                        onClick={() => onRemove(slot.originalIdx)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs leading-none hidden group-hover:flex items-center justify-center"
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full border border-dashed border-gray-200 rounded-lg h-16 flex items-center justify-center bg-gray-50">
                <span className="text-gray-300 text-xs">—</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
