import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Res,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadHelper } from 'src/utils/functions/upload-image.helper';
import { FindPostDto } from './dto/find-post.dto';
import logger from 'src/utils/logger';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: UploadHelper.uploadDirectory,
      }),
    }),
  )
  @Post()
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createPostDto: CreatePostDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const userId = req.user._id;
      const fileList = Array.isArray(files) ? files : [];
      const post = await this.postService.create(
        createPostDto,
        userId,
        fileList,
      );
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Post créé', data: post });
    } catch (error) {
      const status = error.status || HttpStatus.BAD_REQUEST;
      const message =
        error.response?.message || error.message || 'Erreur lors de la création';
      return res.status(status).json({
        message: Array.isArray(message) ? message.join(', ') : message,
      });
    }
  }

  @Get()
  async findAll(@Query() query: FindPostDto, @Res() res) {
    try {
      const posts = await this.postService.findAll(query);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des posts',
        data: posts.data,
        pagination: {
          page: posts.page,
          total: posts.total,
          limit: posts.limit,
          totalPages: posts.totalPages,
        },
      });
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---POST.CONTROLLER.FIND_ONE INIT---`);
      const post = await this.postService.findOne(id);
      logger.info(`---POST.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Post ${id}`,
        data: post,
      });
    } catch (error) {
      logger.error(`---POST.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Res() res,
  ) {
    try {
      logger.info(`---POST.CONTROLLER.UPDATE INIT---`);
      const updated = await this.postService.update(id, updatePostDto);
      logger.info(`---POST.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Post ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---POST.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      logger.info(`---POST.CONTROLLER.REMOVE INIT---`);
      const userId = req.user._id;
      const deleted = await this.postService.remove(id, userId);
      logger.info(`---POST.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Post ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---POST.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
