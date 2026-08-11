insert into public.portfolio_items (
  id, type, title, category, subtitle, description, tags,
  challenge, solution, outcome, sort_order, featured, published
)
values
  (
    'project-guardian-bag', 'project', 'Guardian Bag: IoT Smart Backpack', 'IoT', 'Child-safety prototype',
    'An IoT-based smart backpack concept for child safety, combining location tracking, camera support, and GSM communication.',
    array['ESP32', 'GPS', 'GSM', 'SIM800L', 'Telegram', 'IoT'],
    'A child-safety concept needed practical location awareness and timely remote alerts without depending on a short-lived power source.',
    'Integrated GPS tracking, a camera module, GSM communication, real-time geofencing alerts, and Telegram-based monitoring around a 10,000 mAh power system.',
    'Produced an end-to-end IoT safety prototype with remote status and alert capabilities.',
    70, false, true
  ),
  (
    'project-rfid-attendance', 'project', 'RFID-Based Attendance System', 'Embedded', 'ESP8266 and RDM6300',
    'An automated attendance system that reads RFID cards through a microcontroller and processes attendance data through modular code.',
    array['ESP8266', 'RDM6300', 'RFID', 'Embedded C++'],
    'Manual attendance collection is slow and difficult to keep consistent.',
    'Integrated an RFID reader with an ESP8266 and structured the reading and processing logic into modular components.',
    'Created a repeatable automated attendance workflow for RFID card scans.',
    80, false, true
  ),
  (
    'project-student-management', 'project', 'Student Management System', 'Web', 'PHP and MySQL',
    'A web-based student management system with scheduling, database-backed records, and email functionality.',
    array['PHP', 'MySQL', 'JavaScript', 'PHPMailer', 'XAMPP'],
    'Student records, schedules, and communications needed a central, web-accessible workflow.',
    'Built the system with PHP, MySQL, and JavaScript, including dynamic scheduling and PHPMailer-based email functionality.',
    'Delivered a connected management workflow for records, schedules, and notifications.',
    90, false, true
  ),
  (
    'timeline-service', 'experience', 'Service Crew - McDonald''s Paseo Arcenas', 'Experience', 'Jan 2025 - Dec 2025',
    'Delivered customer service in a fast-paced environment while maintaining efficient, clean operations and dependable teamwork.',
    array['Customer service', 'Teamwork', 'Operations'],
    '', '', '', 30, false, true
  )
on conflict (id) do nothing;
