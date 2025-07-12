const Joi = require('joi');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Data file path
const DATA_FILE = path.join(__dirname, '../data/personal_data.json');

// Personal data schema for validation
const personalDataSchema = Joi.object({
  id: Joi.string().optional(),
  biography: Joi.object({
    name: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().optional(),
    age: Joi.number().optional(),
    background: Joi.string().optional()
  }).optional(),
  
  skills: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().required(),
    category: Joi.string().required(), // e.g., 'programming', 'tools', 'soft-skills'
    proficiency: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
    yearsOfExperience: Joi.number().optional(),
    description: Joi.string().optional()
  })).optional(),
  
  projects: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    technologies: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('completed', 'in-progress', 'planned', 'archived').required(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    repositoryUrl: Joi.string().uri().optional(),
    demoUrl: Joi.string().uri().optional(),
    role: Joi.string().optional(),
    achievements: Joi.array().items(Joi.string()).optional()
  })).optional(),
  
  preferences: Joi.object({
    workStyle: Joi.string().optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    goals: Joi.array().items(Joi.string()).optional(),
    values: Joi.array().items(Joi.string()).optional(),
    communicationStyle: Joi.string().optional(),
    preferredTechnologies: Joi.array().items(Joi.string()).optional()
  }).optional(),
  
  socialLinks: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    platform: Joi.string().required(), // e.g., 'linkedin', 'github', 'twitter'
    url: Joi.string().uri().required(),
    username: Joi.string().optional(),
    isPublic: Joi.boolean().default(true)
  })).optional(),
  
  experience: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    company: Joi.string().required(),
    position: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    description: Joi.string().optional(),
    achievements: Joi.array().items(Joi.string()).optional(),
    technologies: Joi.array().items(Joi.string()).optional(),
    isCurrent: Joi.boolean().default(false)
  })).optional(),
  
  education: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    institution: Joi.string().required(),
    degree: Joi.string().required(),
    field: Joi.string().required(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    gpa: Joi.number().optional(),
    achievements: Joi.array().items(Joi.string()).optional()
  })).optional(),
  
  metadata: Joi.object({
    createdAt: Joi.date().default(Date.now),
    updatedAt: Joi.date().default(Date.now),
    version: Joi.string().default('1.0.0')
  }).optional()
});

class PersonalData {
  constructor() {
    this.initializeDataFile();
  }

  async initializeDataFile() {
    try {
      // Ensure data directory exists
      await fs.ensureDir(path.dirname(DATA_FILE));
      
      // Create initial data file if it doesn't exist
      if (!await fs.pathExists(DATA_FILE)) {
        const initialData = {
          biography: {
            name: "Your Name",
            title: "Your Title",
            description: "Add your personal description here",
            location: "Your Location"
          },
          skills: [],
          projects: [],
          preferences: {
            interests: [],
            goals: []
          },
          socialLinks: [],
          experience: [],
          education: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: "1.0.0"
          }
        };
        await fs.writeJson(DATA_FILE, initialData, { spaces: 2 });
      }
    } catch (error) {
      console.error('Error initializing data file:', error);
    }
  }

  async getAllData() {
    try {
      return await fs.readJson(DATA_FILE);
    } catch (error) {
      console.error('Error reading personal data:', error);
      return null;
    }
  }

  async updateData(newData) {
    try {
      // Validate the data
      const { error, value } = personalDataSchema.validate(newData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      // Add IDs to nested objects if they don't have them
      if (value.skills) {
        value.skills = value.skills.map(skill => ({
          ...skill,
          id: skill.id || uuidv4()
        }));
      }

      if (value.projects) {
        value.projects = value.projects.map(project => ({
          ...project,
          id: project.id || uuidv4()
        }));
      }

      if (value.socialLinks) {
        value.socialLinks = value.socialLinks.map(link => ({
          ...link,
          id: link.id || uuidv4()
        }));
      }

      if (value.experience) {
        value.experience = value.experience.map(exp => ({
          ...exp,
          id: exp.id || uuidv4()
        }));
      }

      if (value.education) {
        value.education = value.education.map(edu => ({
          ...edu,
          id: edu.id || uuidv4()
        }));
      }

      // Update metadata
      value.metadata = {
        ...value.metadata,
        updatedAt: new Date(),
        version: "1.0.0"
      };

      await fs.writeJson(DATA_FILE, value, { spaces: 2 });
      return value;
    } catch (error) {
      console.error('Error updating personal data:', error);
      throw error;
    }
  }

  async getSection(sectionName) {
    try {
      const data = await this.getAllData();
      return data[sectionName] || null;
    } catch (error) {
      console.error(`Error reading section ${sectionName}:`, error);
      return null;
    }
  }

  async updateSection(sectionName, sectionData) {
    try {
      const currentData = await this.getAllData();
      currentData[sectionName] = sectionData;
      currentData.metadata.updatedAt = new Date();
      
      await fs.writeJson(DATA_FILE, currentData, { spaces: 2 });
      return currentData[sectionName];
    } catch (error) {
      console.error(`Error updating section ${sectionName}:`, error);
      throw error;
    }
  }

  // Search functionality for the AI
  async searchRelevantData(query) {
    try {
      const data = await this.getAllData();
      const searchTerms = query.toLowerCase().split(' ');
      const relevantData = {};

      // Search in biography
      if (this.containsTerms(JSON.stringify(data.biography).toLowerCase(), searchTerms)) {
        relevantData.biography = data.biography;
      }

      // Search in skills
      const relevantSkills = data.skills?.filter(skill => 
        this.containsTerms(JSON.stringify(skill).toLowerCase(), searchTerms)
      );
      if (relevantSkills?.length > 0) {
        relevantData.skills = relevantSkills;
      }

      // Search in projects
      const relevantProjects = data.projects?.filter(project => 
        this.containsTerms(JSON.stringify(project).toLowerCase(), searchTerms)
      );
      if (relevantProjects?.length > 0) {
        relevantData.projects = relevantProjects;
      }

      // Search in experience
      const relevantExperience = data.experience?.filter(exp => 
        this.containsTerms(JSON.stringify(exp).toLowerCase(), searchTerms)
      );
      if (relevantExperience?.length > 0) {
        relevantData.experience = relevantExperience;
      }

      // Always include preferences for context
      if (data.preferences) {
        relevantData.preferences = data.preferences;
      }

      return relevantData;
    } catch (error) {
      console.error('Error searching personal data:', error);
      return {};
    }
  }

  containsTerms(text, terms) {
    return terms.some(term => text.includes(term));
  }

  validate(data) {
    return personalDataSchema.validate(data);
  }
}

module.exports = PersonalData;