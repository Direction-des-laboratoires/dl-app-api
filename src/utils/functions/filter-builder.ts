import { Role } from "../enums/roles.enum";
import { StatisticsFilterDto } from "../dto/statistics-filter.dto";

export async function buildStatisticsFilters(
  user: any,
  query: StatisticsFilterDto,
  labModel: any,
  structureModel: any,
  dateField: string = 'created_at'
) {
  const filters: any = {};

  // 1. Date filters
  if (query.startDate || query.endDate) {
    filters[dateField] = {};
    if (query.startDate) {
      filters[dateField].$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filters[dateField].$lte = new Date(query.endDate);
    }
  }

  // 2. Lab/Location filters
  if (user.role !== Role.SuperAdmin) {
    filters.lab = user.lab;
  } else {
    // SuperAdmin can filter by lab, region, department, district
    if (query.lab) {
      filters.lab = query.lab;
    } else if (query.region || query.department || query.district) {
      const structureFilters: any = {};
      if (query.region) structureFilters.region = query.region;
      if (query.department) structureFilters.department = query.department;
      if (query.district) structureFilters.district = query.district;

      const matchingStructures = await structureModel.find(structureFilters).select('_id').lean();
      const structureIds = matchingStructures.map(s => s._id);

      const matchingLabs = await labModel.find({ structure: { $in: structureIds } }).select('_id').lean();
      const labIds = matchingLabs.map(l => l._id);
      
      filters.lab = { $in: labIds };
    }
  }

  return filters;
}

