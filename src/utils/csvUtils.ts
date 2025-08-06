import { Sprint } from '@/types/sprint';

export interface SprintCSVData {
  name: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  teamCapacity: number;
  teamAvailability: number;
  notes: string;
}

export const generateCSVTemplate = (): string => {
  const headers = [
    'name',
    'startDate',
    'endDate',
    'plannedPoints',
    'completedPoints',
    'teamCapacity',
    'teamAvailability',
    'notes'
  ];
  
  const sampleData = [
    'Sprint 1',
    '2024-01-01',
    '2024-01-14',
    '32',
    '28',
    '30',
    '90',
    'Good sprint, one story moved to next sprint'
  ];
  
  return [headers.join(','), sampleData.join(',')].join('\n');
};

export const downloadCSVTemplate = (): void => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sprint_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportSprintsToCSV = (sprints: Sprint[]): void => {
  const headers = [
    'name',
    'startDate',
    'endDate',
    'plannedPoints',
    'completedPoints',
    'teamCapacity',
    'teamAvailability',
    'notes'
  ];
  
  const csvData = sprints.map(sprint => [
    sprint.name,
    sprint.startDate,
    sprint.endDate,
    sprint.plannedPoints.toString(),
    sprint.completedPoints.toString(),
    (sprint.teamCapacity || '').toString(),
    sprint.teamAvailability.toString(),
    sprint.notes || ''
  ]);
  
  const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sprints_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSVFile = (file: File): Promise<SprintCSVData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header and one data row'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const expectedHeaders = ['name', 'startDate', 'endDate', 'plannedPoints', 'completedPoints', 'teamCapacity', 'teamAvailability', 'notes'];
        
        // Validate headers
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
          return;
        }
        
        const data: SprintCSVData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length !== headers.length) {
            reject(new Error(`Row ${i + 1} has incorrect number of columns`));
            return;
          }
          
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });
          
          // Validate and convert data types
          const sprintData: SprintCSVData = {
            name: rowData.name || '',
            startDate: rowData.startDate || '',
            endDate: rowData.endDate || '',
            plannedPoints: parseFloat(rowData.plannedPoints) || 0,
            completedPoints: parseFloat(rowData.completedPoints) || 0,
            teamCapacity: parseFloat(rowData.teamCapacity) || 0,
            teamAvailability: parseFloat(rowData.teamAvailability) || 100,
            notes: rowData.notes || ''
          };
          
          data.push(sprintData);
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};