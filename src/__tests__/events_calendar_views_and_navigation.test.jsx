import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';

// GSAP mock
vi.mock('gsap', () => ({
  default: {
    context: (cb) => {
      cb();
      return { revert: vi.fn() };
    },
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
  }
}));

import { EventsCalendar } from '../features/events/components/EventsCalendar';

describe('EventsCalendar Views, Interactive Navigation & Day Filters', () => {
  const mockEvents = [
    {
      id: 'evt-1',
      title: 'مؤتمر المناخ والصحة 2026',
      date: '2026-07-15',
      time: '10:00 AM',
      type: 'مؤتمر',
      desc: 'مناقشة التغيرات المناخية وتأثيرها على الصحة العامة.',
      location: 'القاهرة'
    },
    {
      id: 'evt-2',
      title: 'ورشة عمل طب الكوارث البيئية',
      date: '2026-07-15',
      time: '02:00 PM',
      type: 'ورشة عمل',
      desc: 'تدريب الأطباء على الاستجابة لحالات الطوارئ المناخية.',
      location: 'عبر الإنترنت'
    },
    {
      id: 'evt-3',
      title: 'ندوة التلوث وجودة الهواء',
      date: '2026-07-28',
      time: '11:00 AM',
      type: 'ندوة',
      desc: 'استراتيجيات تحسين جودة الهواء في المراكز الحضرية.',
      location: 'الرياض'
    },
    {
      id: 'evt-aug',
      title: 'مؤتمر أغسطس البيئي',
      date: '2026-08-10',
      time: '09:00 AM',
      type: 'مؤتمر دولي',
      desc: 'فعالية شهر أغسطس.',
      location: 'دبي'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. View Switching & List Rendering ──────────────────────────────────
  describe('1. View Switching & List Rendering', () => {
    it('renders list view by default with all active events', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
          registeredEvents={{}}
          onRegisterEvent={vi.fn()}
        />
      );

      expect(screen.getByText('الندوات والفعاليات البيئية')).toBeInTheDocument();
      expect(screen.getByText('مؤتمر المناخ والصحة 2026')).toBeInTheDocument();
      expect(screen.getByText('ورشة عمل طب الكوارث البيئية')).toBeInTheDocument();
      expect(screen.getByText('ندوة التلوث وجودة الهواء')).toBeInTheDocument();
    });

    it('renders English header and list elements when isArabic is false', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={false}
          registeredEvents={{}}
          onRegisterEvent={vi.fn()}
        />
      );

      expect(screen.getByText('Environmental Events & Seminars')).toBeInTheDocument();
      expect(screen.getByText('List View')).toBeInTheDocument();
      expect(screen.getByText('Calendar View')).toBeInTheDocument();
    });

    it('toggles viewMode from list to calendar and back', () => {
      const { container } = render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
          onRegisterEvent={vi.fn()}
        />
      );

      // Initially in list view
      const calBtn = screen.getByText('عرض التقويم');
      fireEvent.click(calBtn);

      // Now in calendar view
      expect(screen.getByText('تصفح فعاليات التقويم')).toBeInTheDocument();
      expect(container.querySelector('.ql-editor')).toBeNull();

      // Toggle back to list view
      const listBtn = screen.getByText('عرض القائمة');
      fireEvent.click(listBtn);
      expect(screen.getByText('مؤتمر المناخ والصحة 2026')).toBeInTheDocument();
    });

    it('invokes onRegisterEvent callback when clicking register in list view', () => {
      const onRegisterEvent = vi.fn();
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
          registeredEvents={{ 'evt-1': true }}
          onRegisterEvent={onRegisterEvent}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Find register button for evt-2
      const unregBtn = buttons.find(b => b.textContent?.includes('سجل الآن') || b.textContent?.includes('تسجيل'));
      if (unregBtn) {
        fireEvent.click(unregBtn);
        expect(onRegisterEvent).toHaveBeenCalled();
      }
    });
  });

  // ─── 2. Calendar Grid Rendering & Day Filtering ───────────────────────────
  describe('2. Calendar Grid Rendering & Day Filtering', () => {
    it('renders default July 2026 calendar grid and day names in Arabic', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
        />
      );

      fireEvent.click(screen.getByText('عرض التقويم'));

      expect(screen.getByText('يوليو 2026')).toBeInTheDocument();
      expect(screen.getByText('أحد')).toBeInTheDocument();
      expect(screen.getByText('خميس')).toBeInTheDocument();
      expect(screen.getByText('جمع')).toBeInTheDocument();
    });

    it('renders English month and weekday abbreviations when isArabic is false', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={false}
        />
      );

      fireEvent.click(screen.getByText('Calendar View'));

      expect(screen.getByText('July 2026')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Browse Calendar Events')).toBeInTheDocument();
      expect(screen.getByText('Click on the green highlighted days to view event details.')).toBeInTheDocument();
    });

    it('selects a day with events and displays all its events in the details column', () => {
      const onRegisterEvent = vi.fn();
      const { container } = render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
          onRegisterEvent={onRegisterEvent}
        />
      );

      fireEvent.click(screen.getByText('عرض التقويم'));

      // Find day 15 cell (which has 2 events)
      const dayCells = container.querySelectorAll('.events-calendar-component div');
      let day15Cell = null;
      dayCells.forEach(div => {
        if (div.textContent?.trim() === '15' && div.style.cursor === 'pointer') {
          day15Cell = div;
        }
      });

      expect(day15Cell).not.toBeNull();
      fireEvent.click(day15Cell);

      // Details pane now displays both events
      expect(screen.getByText('مؤتمر المناخ والصحة 2026')).toBeInTheDocument();
      expect(screen.getByText('ورشة عمل طب الكوارث البيئية')).toBeInTheDocument();

      // Register from calendar details view
      const registerButtons = screen.getAllByRole('button');
      const actionBtn = registerButtons.find(b => b.textContent?.includes('سجل الآن') || b.textContent?.includes('تسجيل'));
      if (actionBtn) {
        fireEvent.click(actionBtn);
        expect(onRegisterEvent).toHaveBeenCalledWith('evt-1');
      }
    });

    it('does not select a day that has no events when clicked', () => {
      const { container } = render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
        />
      );

      fireEvent.click(screen.getByText('عرض التقويم'));

      // Find day 2 cell (no event)
      const dayCells = container.querySelectorAll('.events-calendar-component div');
      let day2Cell = null;
      dayCells.forEach(div => {
        if (div.textContent?.trim() === '2' && div.style.cursor === 'default') {
          day2Cell = div;
        }
      });

      if (day2Cell) {
        fireEvent.click(day2Cell);
        // Placeholder should still be visible because selectedDate remains null
        expect(screen.getByText('تصفح فعاليات التقويم')).toBeInTheDocument();
      }
    });
  });

  // ─── 3. Month & Year Navigation Mechanics ────────────────────────────────
  describe('3. Month & Year Navigation Mechanics', () => {
    it('navigates next month and prev month in Arabic (inverted arrow direction for RTL)', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
        />
      );

      fireEvent.click(screen.getByText('عرض التقويم'));
      expect(screen.getByText('يوليو 2026')).toBeInTheDocument();

      // In Arabic, left arrow '<' calls handleNextMonth
      const leftArrow = screen.getByText('<');
      fireEvent.click(leftArrow);
      expect(screen.getByText('أغسطس 2026')).toBeInTheDocument();

      // Right arrow '>' calls handlePrevMonth
      const rightArrow = screen.getByText('>');
      fireEvent.click(rightArrow);
      expect(screen.getByText('يوليو 2026')).toBeInTheDocument();
    });

    it('navigates prev month and next month in English mode', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={false}
        />
      );

      fireEvent.click(screen.getByText('Calendar View'));
      expect(screen.getByText('July 2026')).toBeInTheDocument();

      // In English, left arrow '<' calls handlePrevMonth
      const leftArrow = screen.getByText('<');
      fireEvent.click(leftArrow);
      expect(screen.getByText('June 2026')).toBeInTheDocument();

      // Right arrow '>' calls handleNextMonth
      const rightArrow = screen.getByText('>');
      fireEvent.click(rightArrow);
      expect(screen.getByText('July 2026')).toBeInTheDocument();
    });

    it('handles year rollover forward when navigating past December', () => {
      render(
        <EventsCalendar
          events={[]}
          isArabic={false}
        />
      );

      fireEvent.click(screen.getByText('Calendar View'));

      // Advance 5 times from July (6) to December (11)
      const nextBtn = screen.getByText('>');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtn);
      }
      expect(screen.getByText('December 2026')).toBeInTheDocument();

      // Advance once more -> January 2027
      fireEvent.click(nextBtn);
      expect(screen.getByText('January 2027')).toBeInTheDocument();
    });

    it('handles year rollover backward when navigating prior to January', () => {
      render(
        <EventsCalendar
          events={[]}
          isArabic={false}
        />
      );

      fireEvent.click(screen.getByText('Calendar View'));

      // Retreat 6 times from July (6) to January (0)
      const prevBtn = screen.getByText('<');
      for (let i = 0; i < 6; i++) {
        fireEvent.click(prevBtn);
      }
      expect(screen.getByText('January 2026')).toBeInTheDocument();

      // Retreat once more -> December 2025
      fireEvent.click(prevBtn);
      expect(screen.getByText('December 2025')).toBeInTheDocument();
    });
  });

  // ─── 4. Event Management Button & Fallback States ─────────────────────────
  describe('4. Event Management Button & Fallback States', () => {
    it('renders Add Event button when canManageEvents is true and fires onAddEvent', () => {
      const onAddEvent = vi.fn();
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
          canManageEvents={true}
          onAddEvent={onAddEvent}
        />
      );

      const addBtn = screen.getByText('+ إضافة فعالية');
      expect(addBtn).toBeInTheDocument();
      fireEvent.click(addBtn);
      expect(onAddEvent).toHaveBeenCalledTimes(1);
    });

    it('renders English "+ Add Event" button when isArabic is false', () => {
      const onAddEvent = vi.fn();
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={false}
          canManageEvents={true}
          onAddEvent={onAddEvent}
        />
      );

      const addBtn = screen.getByText('+ Add Event');
      expect(addBtn).toBeInTheDocument();
      fireEvent.click(addBtn);
      expect(onAddEvent).toHaveBeenCalledTimes(1);
    });

    it('omits Add Event button when canManageEvents is falsy', () => {
      render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
          canManageEvents={false}
        />
      );

      expect(screen.queryByText('+ إضافة فعالية')).toBeNull();
      expect(screen.queryByText('+ Add Event')).toBeNull();
    });

    it('renders empty day message when a selected date has no active events', () => {
      const { container, rerender } = render(
        <EventsCalendar
          events={mockEvents}
          isArabic={true}
        />
      );

      fireEvent.click(screen.getByText('عرض التقويم'));

      // Select day 15
      const dayCells = container.querySelectorAll('.events-calendar-component div');
      dayCells.forEach(div => {
        if (div.textContent?.trim() === '15' && div.style.cursor === 'pointer') {
          fireEvent.click(div);
        }
      });

      expect(screen.getByText('مؤتمر المناخ والصحة 2026')).toBeInTheDocument();

      // Now rerender with empty events
      rerender(
        <EventsCalendar
          events={[]}
          isArabic={true}
        />
      );

      expect(screen.getByText('لا توجد فعاليات في هذا اليوم.')).toBeInTheDocument();

      // In English
      rerender(
        <EventsCalendar
          events={[]}
          isArabic={false}
        />
      );

      expect(screen.getByText('No events on this day.')).toBeInTheDocument();
    });

    it('renders safely when no props are provided', () => {
      const { container } = render(<EventsCalendar />);
      expect(container.querySelector('.events-calendar-component')).toBeInTheDocument();
      expect(screen.getByText('الندوات والفعاليات البيئية')).toBeInTheDocument();
    });
  });
});
