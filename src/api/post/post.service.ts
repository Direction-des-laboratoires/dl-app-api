import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './interfaces/post.interface';
import { minioUploadFile } from 'src/utils/functions/file.upload';
import logger from 'src/utils/logger';
import { PostTypesEnum } from 'src/utils/enums/post.enum';


@Injectable()
export class PostService {
  constructor(@InjectModel('Post') private postModel: Model<Post>) {}
  async create(
    createPostDto: CreatePostDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    try {
      const fileList = files || [];
      const filesUrls = await Promise.all(
        fileList.map((file) => minioUploadFile(file)),
      );
      const post = new this.postModel(createPostDto);
      post.author = userId;
      post.files = filesUrls;
      return await post.save();
    } catch (error) {
      logger.error(`---POST.SERVICE.CREATE ERROR--- ${error}`);
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    type?: PostTypesEnum;
    title?: string;
    author?: string;
    active?: boolean;
    upcomingEvents?: boolean;
    search?: string;
  }): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        title,
        author,
        active,
        upcomingEvents,
        search,
      } = query;

      // Construction dynamique des filtres
      const filters: any = {};

      // Si search est fourni, rechercher dans title, description et les infos de l'auteur
      if (search) {
        // Récupérer les IDs des users qui correspondent au search (firstname, lastname, email)
        const UserModel = this.postModel.db.model('User');
        const matchingUsers = await UserModel.find({
          $or: [
            { firstname: { $regex: search, $options: 'i' } },
            { lastname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        })
          .select('_id')
          .lean();

        const userIds = matchingUsers.map((u: any) => u._id);

        // Rechercher dans title, description OU dans les auteurs correspondants
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];

        // Si des users correspondent, ajouter le filtre sur author
        if (userIds.length > 0) {
          filters.$or.push({ author: { $in: userIds } });
        }
      } else {
        // Sinon, utiliser les filtres individuels
        if (title) filters.title = { $regex: title, $options: 'i' }; // insensible à la casse
        if (author) filters.author = author;
      }

      if (type) filters.type = type;
      if (active !== undefined) filters.active = active;
      if (upcomingEvents) {
        filters.type = PostTypesEnum.EVENT;
        filters.eventDate = { $gte: new Date() }; // date >= aujourd'hui
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Requête avec populate de l'auteur
      const [data, total] = await Promise.all([
        this.postModel
          .find(filters)
          .populate({ path: 'author', select: 'firstname lastname email' })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.postModel.countDocuments(filters),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new HttpException(error.message || 'Erreur serveur', 500);
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---POST.SERVICE.FIND_ONE INIT---`);
      const post = await this.postModel
        .findById(id)
        .populate('author', 'firstname lastname phoneNumber email')
        .exec();
      if (!post) {
        throw new HttpException('Post non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---POST.SERVICE.FIND_ONE SUCCESS---`);
      return post;
    } catch (error) {
      logger.error(`---POST.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    try {
      logger.info(`---POST.SERVICE.UPDATE INIT---`);
      const updated = await this.postModel
        .findByIdAndUpdate(
          id,
          { ...updatePostDto, updated_at: new Date() },
          { new: true },
        )
        .populate('author', 'firstname lastname phoneNumber email')
        .exec();
      if (!updated) {
        throw new HttpException('Post non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---POST.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---POST.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, userId: string) {
    try {
      logger.info(`---POST.SERVICE.REMOVE INIT---`);
      const deleted = await this.postModel
        .findByIdAndUpdate(
          id,
          {
            active: false,
            deletedBy: userId,
            updated_at: new Date(),
          },
          { new: true },
        )
        .populate('deletedBy', 'firstname lastname phoneNumber email')
        .exec();
      if (!deleted) {
        throw new HttpException('Post non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---POST.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---POST.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
