import {IconLinkOff, IconTool} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../../components/control/icon-button';
import { Passage, Story, updatePassage } from '../../../../store/stories';
import { useUndoableStoriesContext } from '../../../../store/undoable-stories';
import { usePersistence } from '../../../../store/persistence/use-persistence';
import {v4 as uuid} from '@lukeed/uuid';

import svgTemplate from '../../../../util/svg-template.svg?raw';

export interface AddSceneButtonProps {
	story: Story;
	passage: Passage;
}

export const SceneControls: React.FC<AddSceneButtonProps> = props => {
	const {passages} = props.story;
	const {passage} = props;
	const {dispatch} = useUndoableStoriesContext();
	const {scenes: scenesPersistence} = usePersistence();

	const {t} = useTranslation();
	const passagesWithSvg = passages.filter(passage => passage.svg !== undefined);
	const scenesMapOfPassages: {[svgUrl: string]: Passage[]} = {};
	passagesWithSvg.forEach(passage => {
		if (passage.svg) {
			scenesMapOfPassages[passage.svg] = scenesMapOfPassages[passage.svg] || [];
			scenesMapOfPassages[passage.svg].push(passage);
		}
	});

	const scenes = Object.entries(scenesMapOfPassages).map(([svgUrl, passages]) =>
		({svgUrl, name: passages.map(passage => passage.name).join(', ')}));

	const isSceneLinkedOnlyToThisPassage = scenesMapOfPassages[passage.svg]?.length === 1;

	const handleNewScene = () => {
		const id = uuid()
		scenesPersistence?.save(svgTemplate, id)
		dispatch(updatePassage(props.story, props.passage, {svg: id}));
	};

	const handleCopyScene = async (svgUrl: string) => {
		const svg = await scenesPersistence?.get(svgUrl)
		if (!svg){
			console.error('no SVG was returned.')
			return;
		}
		const id = uuid()
		await scenesPersistence?.save(id, svg)

		dispatch(updatePassage(props.story, props.passage, {svg: id}));
	};

	const handleLinkSceneChange = (id: string) => {
		dispatch(updatePassage(props.story, props.passage, {svg: id}));
	};

	const deleteScene = async (id: string) => {
		await scenesPersistence?.remove(id)
		dispatch(updatePassage(props.story, props.passage, {svg: ''}));
	};


	const scenesOptions = scenes.map(scene => (
		<option key={scene.svgUrl} value={scene.svgUrl}>
			{scene.name}
		</option>
	));

	return (
		<>
			<select
				aria-label={t('routes.storyEdit.toolbar.linkSceneAlt')}
				onChange={(event) => handleLinkSceneChange(event.target.value)}
				value={passage.svg ?? ''}
			>
				<option value="" disabled>
					{t('routes.storyEdit.toolbar.linkScene')}
				</option>
				{scenesOptions}
			</select>

			<select
				aria-label={t('routes.storyEdit.toolbar.copySceneAlt')}
				onChange={(event) => handleCopyScene(event.target.value)}
				value={''}
			>
				<option value="" disabled>
					{t('routes.storyEdit.toolbar.copyScene')}
				</option>
				{scenesOptions}
			</select>

		{!passage.svg && (
			<IconButton
				icon={<IconTool />}
				label={t('routes.storyEdit.toolbar.addScene')}
			onClick={handleNewScene}
		/>
		)}
		{passage.svg && !isSceneLinkedOnlyToThisPassage && (
			<IconButton
				icon={<IconLinkOff />}
				label={t('routes.storyEdit.toolbar.unlinkScene')}
				onClick={() => handleLinkSceneChange('')}
			/>
			)}
		{passage.svg && isSceneLinkedOnlyToThisPassage && (
			<IconButton
				icon={<IconLinkOff />}
				label={t('routes.storyEdit.toolbar.deleteScene')}
				onClick={() => deleteScene(passage.svg)}
			/>
			)}
		</>
	);
};
