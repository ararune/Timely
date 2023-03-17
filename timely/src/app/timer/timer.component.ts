import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';



interface Project {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: string;
}

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent implements OnDestroy {
  displayTime = '00:00:00';
  startTime: Date | null = null;
  timer: any;
  paused = false;
  pausedTime: Date | null = null;
  elapsedPausedTime = 0;

  projectTitle = '';
  projectDescription = '';
  projects: Project[] = [];
  showForm = false;

  currentPage = 1;
  projectsPerPage = 5;
  totalPages = 1;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getProjects();
  }

    
  deleteProject(project: Project) {
    const projectId = project.id;
    this.http.delete(`http://localhost:3000/projects/${projectId}`).subscribe(() => {
      const index = this.projects.findIndex(p => p.id === projectId);
      if (index !== -1) {
        this.projects.splice(index, 1);
      }
    });
  }
  
  getProjects() {
    const startIndex = (this.currentPage - 1) * this.projectsPerPage;
    const endIndex = startIndex + this.projectsPerPage - 1;

    this.http.get<Project[]>('http://localhost:3000/projects')
  .subscribe({
    next: (data: Project[]) => {
      this.totalPages = Math.ceil(data.length / this.projectsPerPage);
      this.projects = data.slice(startIndex, endIndex + 1);
    },
    error: (error) => {
      console.log(error);
    }
  });

  }
  previousPage() {
    this.currentPage--;
    this.getProjects();
  }
  
  nextPage() {
    this.currentPage++;
    this.getProjects();
  }
  
  goToPage(page: number) {
    this.currentPage = page;
    this.getProjects();
  }
  
  getPages() {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  stop() {
    clearInterval(this.timer);
    this.startTime = null;
    this.paused = false;
    this.elapsedPausedTime = 0;
    this.showForm = true;
  }

  
  onSubmit() {
    if (this.projectTitle && this.projectDescription) {
      const newProject = this.createProject();
      this.projects.push(newProject);
      this.saveProject(newProject);
      this.resetForm();
      this.getProjects();

       // hide message
      const messageElement = document.querySelector('.form-message');
      if (messageElement) {
        messageElement.remove();
    }
    }
  }
  
  createProject() {
    const startTime = this.startTime || new Date();
    const startTimeString = this.formatDate(startTime);
    const endTimeString = this.formatDate(new Date());
    
    return {
      id: uuidv4(),
      title: this.projectTitle,
      description: this.projectDescription,
      startTime: startTimeString,
      endTime: endTimeString,
      duration: this.displayTime,
    };
  }
  
  saveProject(project: Project) {
    this.http.post('http://localhost:3000/projects', project).subscribe(() => {
      console.log('New project added:', project);
    });
  }
  
  resetForm() {
    this.projectTitle = '';
    this.projectDescription = '';
    this.showForm = false;
  }
  start() {
    if (!this.startTime) {
      this.startTime = new Date();
    }

    this.showForm = false;
    this.timer = setInterval(() => {
      const currentTime = new Date();
      const diff = currentTime.getTime() - this.startTime!.getTime() - this.elapsedPausedTime;
      this.displayTime = this.msToTime(diff);
    }, 1000);
  }

  toggle() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause() {
    clearInterval(this.timer);
    this.paused = true;
    this.pausedTime = new Date();
  }

  resume() {
    this.elapsedPausedTime += new Date().getTime() - this.pausedTime!.getTime();
    this.paused = false;
    this.start();
  }

  msToTime(duration: number) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    return (
      this.formatTime(hours) +
      ':' +
      this.formatTime(minutes) +
      ':' +
      this.formatTime(seconds)
    );
  }

  formatDate(date: Date) {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  formatTime(time: number) {
    return time < 10 ? '0' + time : time;
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
  downloadProjects() {
    // Create a copy of the projects array with the ID property removed
    const projectsCopy = this.projects.map(({ id, ...rest }) => rest);
  
    // Convert the modified projects data to Excel format
    const worksheet = XLSX.utils.json_to_sheet(projectsCopy);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
    // Create a Blob object from the Excel data
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
    // Save the file using file-saver
    saveAs(blob, 'projects.xlsx');
  }
  
}
