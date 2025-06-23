import React, { useState, useEffect } from 'react';
import '../styles/proctorSetAvailability.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ProctorSetAvailability = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('7 AM - 12 NN (Morning)');
  const [availabilityStatus, setAvailabilityStatus] = useState<string>('Available');
  const [remarks, setRemarks] = useState<string>('');
  const [changeStatus, setChangeStatus] = useState<string>('Unavailable');
  const [reason, setReason] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const today = new Date();

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const daysArray: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= numDays; i++) {
      daysArray.push(i);
    }
    return daysArray;
  };

  const handleDateSelect = (day: number | null) => {
    if (day) {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(newDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
      setShowDatePicker(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  };

  const timeSlots = [
    '7 AM - 12 NN (Morning)',
    '1 PM - 5 PM (Afternoon)',
    '5 PM - 9 PM (Evening)'
  ];

  const availabilityOptions = ['Available', 'Unavailable'];

  const handleSubmitAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Availability set successfully!');
  };

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Change request submitted!');
  };

  return (
    <div className="set-availability-container">
      <div className="availability-sections">
        {/* Set Availability Section */}
        <div className="availability-card">
          <div className="card-header-set">Set Availability</div>
          <form onSubmit={handleSubmitAvailability} className="availability-form">
            <div className="form-group">
              <label htmlFor="day">Day</label>
              <div className="custom-select-wrapper">
                <input
                  type="text"
                  id="day"
                  value={selectedDate}
                  readOnly
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="date-input-field"
                />
                <span className="dropdown-arrow" onClick={() => setShowDatePicker(!showDatePicker)}>&#9660;</span>
                {showDatePicker && (
                  <div className="date-picker">
                    <div className="date-picker-header">
                      <button type="button" onClick={goToPreviousMonth}><FaChevronLeft /></button>
                      <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      <button type="button" onClick={goToNextMonth}><FaChevronRight /></button>
                    </div>
                    <div className="date-picker-grid">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, index) => (
                        <div key={index} className="day-name">{dayName}</div>
                      ))}
                      {getCalendarDays().map((day, index) => {
                        const currentCalendarDayDate = day
                          ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                          : null;
                        const isSelected = currentCalendarDayDate &&
                          selectedDate === currentCalendarDayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        const isToday = currentCalendarDayDate &&
                          currentCalendarDayDate.toDateString() === today.toDateString();

                        return (
                          <div
                            key={index}
                            className={`calendar-day ${day ? 'selectable' : ''} ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    <div className="date-picker-footer">
                      <button type="button" onClick={goToToday}>Now</button>
                      <button type="button" onClick={() => setShowDatePicker(false)}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="timeSlot">Time Slot</label>
              <div className="custom-select-wrapper">
                <select
                  id="timeSlot"
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="custom-select"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <span className="dropdown-arrow">&#9660;</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <div className="custom-select-wrapper">
                <select
                  id="status"
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                  className="custom-select"
                >
                  {availabilityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="dropdown-arrow">&#9660;</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Type here..."
              ></textarea>
            </div>

            <button type="submit" className="submit-button">Submit</button>
          </form>
        </div>

        {/* Request Change Section */}
        <div className="availability-card">
          <div className="card-header-request">Request Change of Availability</div>
          <div className="subtitle">(only available after the release of exam schedule)</div>
          <form onSubmit={handleSubmitChangeRequest} className="availability-form">
            <div className="form-group">
              <label htmlFor="changeStatus">Status</label>
              <div className="custom-select-wrapper">
                <select
                  id="changeStatus"
                  value={changeStatus}
                  onChange={(e) => setChangeStatus(e.target.value)}
                  className="custom-select"
                >
                  {availabilityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="dropdown-arrow">&#9660;</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason/s</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Type here..."
              ></textarea>
            </div>

            <button type="submit" className="submit-button">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProctorSetAvailability;
