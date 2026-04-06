
WITH kids_totals AS (
  SELECT event_date,
    SUM(volunteer_classroom_attendance + nursery_attendance + k3_attendance + grade_4_6_attendance + youth_attendance) as total_kids
  FROM attendance GROUP BY event_date
)
UPDATE attendance a SET 
  adjusted_total = CASE 
    WHEN a.service IN ('1st Sunday Service (9:15)', '9:15 AM') 
      THEN a.sanctuary_attendance - ROUND(0.2 * k.total_kids)::int
    WHEN a.service = 'Not Applicable'
      THEN a.volunteer_classroom_attendance + a.nursery_attendance + a.k3_attendance + a.grade_4_6_attendance + a.youth_attendance
    ELSE a.sanctuary_attendance
  END
FROM kids_totals k
WHERE a.event_date = k.event_date;
