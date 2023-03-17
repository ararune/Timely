const express = require('express');
const fs = require('fs');
const app = express();
const cors = require('cors');
app.use(cors());

app.use(express.json());

function saveData(data) {
  const jsonString = JSON.stringify(data, null, 2);
  console.log("Data to be saved:", jsonString);
  fs.writeFileSync('./data.json', jsonString);
}

app.get('/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const data = JSON.parse(fs.readFileSync('./data.json'));
  const project = data.projects.find(p => p.id === projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
  } else {
    res.json(project);
  }
});
app.delete('/projects/:id', (req, res) => {
  const projectId = req.params.id;
  let data = JSON.parse(fs.readFileSync('./data.json'));
  const projectIndex = data.projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) {
    res.status(404).json({ error: 'Project not found' });
  } else {
    data.projects.splice(projectIndex, 1);
    saveData(data);
    res.json({ message: 'Project deleted successfully' });
  }
});

app.put('/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const { title, description, startTime, endTime, duration } = req.body;
  const data = JSON.parse(fs.readFileSync('./data.json'));
  const projectIndex = data.projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) {
    res.status(404).json({ error: 'Project not found' });
  } else {
    const updatedProject = {
      id: projectId,
      title: title || data.projects[projectIndex].title,
      description: description || data.projects[projectIndex].description,
      startTime: startTime || data.projects[projectIndex].startTime,
      endTime: endTime || data.projects[projectIndex].endTime,
      duration: duration || data.projects[projectIndex].duration,
    };
    data.projects[projectIndex] = updatedProject;
    saveData(data);
    res.json({ message: 'Project updated successfully', project: updatedProject });
  }
});

app.post('/projects', (req, res) => {
    const { id, title, description, startTime, endTime, duration } = req.body;
    const newProject = {
      id,
      title,
      description,
      startTime,
      endTime,
      duration,
    };
    const data = JSON.parse(fs.readFileSync('./data.json'));
    data.projects.push(newProject);
    saveData(data);
    res.json(newProject);
  });

  app.get('/projects', (req, res) => {
    const data = JSON.parse(fs.readFileSync('./data.json'));
    res.json(data.projects);
  });
  
app.listen(3000, () => {
    console.log('Server started on port 3000');
  });