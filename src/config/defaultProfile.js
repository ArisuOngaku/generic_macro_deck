import Profile from "./Profile";
import Layout from "./Layout";
import InternalAction from "../InternalAction";
import OBSAction from "../obs/OBSAction";
import NavigateAction from "../NavigateAction";
import NavigateBackAction from "../NavigateBackAction";
import QuitAction from "../QuitAction";
import ToggleOSDAction from "../ToggleOSDAction";

export default function makeDefaultProfile(quitFunction, obs) {
    const config = new Profile(quitFunction, obs, 'default');
    config.map(82, '0');
    config.map(79, '1');
    config.map(80, '2');
    config.map(81, '3');
    config.map(75, '4');
    config.map(76, '5');
    config.map(77, '6');
    config.map(71, '7');
    config.map(72, '8');
    config.map(73, '9');
    config.map(98, '/');
    config.map(55, '*');
    config.map(74, '-');
    config.map(78, '+');
    config.map(14, 'backspace');
    config.map(96, 'enter');
    config.map(52, '.');
    config.map(111, '.');
    config.map(69, 'numlock');
    config.map(102, 'home');
    config.map(110, '0');
    config.map(107, '1');
    config.map(108, '2');
    config.map(109, '3');
    config.map(105, '4');
    config.map(106, '6');
    config.map(103, '8');
    config.map(104, '9');

    const rootLayout = new Layout('');
    config.addLayout(rootLayout);
    config.navigateToLayout(rootLayout.name);
    const subLayouts = [];
    rootLayout.addAction('-', new QuitAction(config));
    rootLayout.addAction('+', new ToggleOSDAction(config));

    // Obs layouts
    const obsLayouts = [];
    const kingdomTwoCrowns = new Layout('Kingdom Two Crowns');
    rootLayout.addAction(1, new NavigateAction(config, kingdomTwoCrowns.name));
    obsLayouts.push(kingdomTwoCrowns);

    kingdomTwoCrowns.addAction(1, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Arisu/Syra'}));
    kingdomTwoCrowns.addAction(2, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Arisu'}));
    kingdomTwoCrowns.addAction(3, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Syra'}));

    const regular = new Layout('Regular');
    rootLayout.addAction(0, new NavigateAction(config, regular.name));
    obsLayouts.push(regular);

    regular.addAction(1, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Main window'}));

    for (const obsLayout of obsLayouts) {
        obsLayout.addAction(0, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Layout'}));
        obsLayout.addAction(7, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Start'}));
        obsLayout.addAction(8, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'Pause'}));
        obsLayout.addAction(9, new OBSAction(config, 'SetCurrentScene', {'scene-name': 'End'}));
        subLayouts.push(obsLayout);
    }

    for (const subLayout of subLayouts) {
        subLayout.addAction('+', new ToggleOSDAction(config));
        subLayout.addAction('backspace', new NavigateBackAction(config));
        config.addLayout(subLayout);
    }

    return config;
}