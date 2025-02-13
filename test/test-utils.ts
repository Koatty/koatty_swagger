import { ComponentGenerator } from '../src/swagger/components';
import { PathsProcessor } from '../src/swagger/paths';
import {
  DefaultController, EmptyPathController, OrderController,
  TestController,
  UserController, VersionedController
} from './testcontroller';

export function generateSpec() {
  const ctls = [UserController, DefaultController,
    OrderController, VersionedController, EmptyPathController, TestController];
  const components = ComponentGenerator.generate(ctls);
  const paths = PathsProcessor.process(ctls);
  return {
    paths,
    components
  };
}
