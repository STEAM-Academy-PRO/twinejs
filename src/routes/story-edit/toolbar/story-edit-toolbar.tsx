import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {RouteToolbar} from '../../../components/route-toolbar';
import {AppActions, BuildActions} from '../../../route-actions';
import {Story} from '../../../store/stories';
import {Point} from '../../../util/geometry';
import {PassageActions} from './passage/passage-actions';
import {StoryActions} from './story/story-actions';
import {UndoRedoButtons} from './undo-redo-buttons';
import {ZoomButtons} from './zoom-buttons';
import { AssetManager } from '../../../components/asset-manager/asset-manager';
import { IconButton } from '../../../components/control/icon-button';
import { IconUpload } from '@tabler/icons';
import { useDialogsContext } from '../../../dialogs';

export interface StoryEditToolbarProps {
	getCenter: () => Point;
	onOpenFuzzyFinder: () => void;
	story: Story;
}

export const StoryEditToolbar: React.FC<StoryEditToolbarProps> = props => {
	const {getCenter, onOpenFuzzyFinder, story} = props;
	const {t} = useTranslation();
	const {dispatch, dialogs} = useDialogsContext();

	return (
		<RouteToolbar
			pinnedControls={
				<>
					<ZoomButtons story={story} />
					<UndoRedoButtons />
				</>
			}
			tabs={{
				[t('common.passage')]: (
					<PassageActions
						getCenter={getCenter}
						onOpenFuzzyFinder={onOpenFuzzyFinder}
						story={story}
					/>
				),
				[t('common.story')]: <StoryActions story={story} />,
				[t('common.assets')]:
				<IconButton
								icon={<IconUpload />}
								label={t('assetManager.title')}
								onClick={() => dispatch({type: 'addDialog', component: AssetManager})}
							/>
							,
				[t('common.build')]: <BuildActions story={story} />,
				[t('common.appName')]: <AppActions />
			}}
		/>
	);
};
