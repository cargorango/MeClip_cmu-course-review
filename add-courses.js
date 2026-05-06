const fs=require('fs');
const existing=JSON.parse(fs.readFileSync('prisma/free-electives.json','utf8'));
const more=[
