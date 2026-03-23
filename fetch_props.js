const fs = require('fs');
fetch('http://localhost:3000/student/courses/b747b160-9dbe-4ddf-afb2-d8b436e3efd4/classroom?debug=1')
  .then(res => res.text())
  .then(text => fs.writeFileSync('props_out.txt', text));
