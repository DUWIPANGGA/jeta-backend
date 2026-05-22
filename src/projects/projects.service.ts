import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProjectDto, userId: number) {
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id: createDto.custom_order_id },
    });
    
    if (!customOrder) {
      throw new NotFoundException(`Custom order with ID ${createDto.custom_order_id} not found`);
    }

    // Cek apakah project sudah ada
    const existingProject = await this.prisma.project.findFirst({
      where: { custom_order_id: createDto.custom_order_id },
      include: { members: true },
    });

    if (existingProject) {
      // Jika sudah ada, update team jika ada team baru
      if (createDto.team && createDto.team.length > 0) {
        await this.prisma.projectMember.deleteMany({
          where: { project_id: existingProject.id },
        });
        
        for (const member of createDto.team) {
          await this.prisma.projectMember.create({
            data: {
              project_id: existingProject.id,
              user_id: member.user_id,
            },
          });
        }
      }
      
      // Return project dengan members
      return this.prisma.project.findFirst({
        where: { id: existingProject.id },
        include: { members: true },
      });
    }

    // Buat project baru
    const newProject = await this.prisma.project.create({
      data: {
        custom_order_id: createDto.custom_order_id,
        user_id: userId,
        status: createDto.status ?? true,
      },
    });

    // Assign team jika ada
    if (createDto.team && createDto.team.length > 0) {
      for (const member of createDto.team) {
        await this.prisma.projectMember.create({
          data: {
            project_id: newProject.id,
            user_id: member.user_id,
          },
        });
      }
    }

    // Return project dengan members
    return this.prisma.project.findFirst({
      where: { id: newProject.id },
      include: { members: true },
    });
  }

  async findAll(userId: number, isAdmin: boolean) {
    const where = isAdmin ? {} : { user_id: userId };
    
    return this.prisma.project.findMany({
      where,
      include: {
        user: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        progressReports: {
          include: {
            stage: true,
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getMyTasks(userId: number) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { user_id: userId },
      include: {
        project: {
          include: {
            custom_order: {
              include: {
                items: {
                  include: {
                    selected_options: {
                      include: {
                        variant_option: {
                          include: {
                            custom_variant: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            progressReports: {
              where: { staff_id: userId },
              include: {
                stage: true,
              },
            },
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    
    return memberships.map(m => m.project);
  }

  async getQueue(isAdmin: boolean) {
    const where = isAdmin ? {} : { status: true };
    
    return this.prisma.project.findMany({
      where,
      include: {
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: number, userId: number, isAdmin: boolean) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        progressReports: {
          include: {
            stage: true,
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    if (!isAdmin && project.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }
    
    return project;
  }

  async update(id: number, updateDto: UpdateProjectDto, userId: number, isAdmin: boolean) {
    await this.findOne(id, userId, isAdmin);
    
    return this.prisma.project.update({
      where: { id },
      data: updateDto,
      include: {
        custom_order: true,
        members: true,
      },
    });
  }

  async assignStaff(projectId: number, staffIds: number[]) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    await this.prisma.projectMember.deleteMany({
      where: { project_id: projectId },
    });

    for (const staffId of staffIds) {
      await this.prisma.projectMember.create({
        data: {
          project_id: projectId,
          user_id: staffId,
        },
      });
    }

    return this.findOne(projectId, 0, true);
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    await this.findOne(id, userId, isAdmin);
    
    await this.prisma.projectMember.deleteMany({
      where: { project_id: id },
    });
    
    return this.prisma.project.delete({
      where: { id },
    });
  }
}