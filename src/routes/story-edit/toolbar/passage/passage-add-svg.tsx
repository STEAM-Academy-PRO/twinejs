import {IconTool} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../../components/control/icon-button';

export interface AddSvgButtonProps {
	onClick: () => void;
}

export const AddSvgButton: React.FC<AddSvgButtonProps> = props => {
	const {onClick} = props;
	const {t} = useTranslation();

	return (
		<IconButton
			icon={<IconTool />}
			label={t('routes.storyEdit.toolbar.addSvg')}
			onClick={onClick}
		/>
	);
};
