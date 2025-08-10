import { Sprint } from '@/types/sprint';

// Basic sanitization to reduce XSS risk from imported text
export const sanitizeText = (input: string, maxLen = 500): string => {
  try {
    return String(input || '')
      .replace(/[\u0000-\u001F\u007F]/g, '') // strip control chars
      .replace(/<[^>]*>/g, '') // strip HTML tags
      .replace(/["'`]/g, '’') // soften quotes
      .slice(0, maxLen)
      .trim();
  } catch {
    return '';
  }
};

const clampNumber = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export interface SprintCSVData {
  name: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
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
    'teamAvailability',
    'notes'
  ];
  
  const sampleData = [
    'Sprint 1',
    '2024-01-01',
    '2024-01-14',
    '32',
    '28',
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
    'teamAvailability',
    'notes'
  ];
  
  const csvData = sprints.map(sprint => [
    sprint.name,
    sprint.startDate,
    sprint.endDate,
    sprint.plannedPoints.toString(),
    sprint.completedPoints.toString(),
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
    // File validation
    const maxSizeBytes = 1 * 1024 * 1024; // 1MB
    const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCSV) {
      reject(new Error('Invalid file type. Please upload a .csv file.'));
      return;
    }
    if (file.size > maxSizeBytes) {
      reject(new Error('File is too large. Maximum allowed size is 1MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header and one data row'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const expectedHeaders = ['name', 'startDate', 'endDate', 'plannedPoints', 'completedPoints', 'teamAvailability', 'notes'];

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

          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] ?? '';
          });

          const plannedPoints = Math.max(0, Number.parseFloat(rowData.plannedPoints));
          const completedPoints = Math.max(0, Number.parseFloat(rowData.completedPoints));
          const teamAvailabilityRaw = Number.parseFloat(rowData.teamAvailability);

          const sprintData: SprintCSVData = {
            name: sanitizeText(rowData.name, 120),
            startDate: sanitizeText(rowData.startDate, 25),
            endDate: sanitizeText(rowData.endDate, 25),
            plannedPoints: Number.isFinite(plannedPoints) ? plannedPoints : 0,
            completedPoints: Number.isFinite(completedPoints) ? completedPoints : 0,
            teamAvailability: Number.isFinite(teamAvailabilityRaw)
              ? clampNumber(teamAvailabilityRaw, 0, 100)
              : 100,
            notes: sanitizeText(rowData.notes, 1000)
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