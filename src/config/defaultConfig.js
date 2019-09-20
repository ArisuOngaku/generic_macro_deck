import Config from "./Config";
import Layout from "../Layout";
import InternalAction from "../InternalAction";
import OBSAction from "../obs/OBSAction";

export default function makeDefaultConfig(quitAction, obs) {
    const config = new Config();
    config.map(82, 0);
    config.map(79, 1);
    config.map(80, 2);
    config.map(81, 3);
    config.map(75, 4);
    config.map(76, 5);
    config.map(77, 6);
    config.map(71, 7);
    config.map(72, 8);
    config.map(73, 9);
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
    config.map(110, 0);
    config.map(107, 1);
    config.map(108, 2);
    config.map(109, 3);
    config.map(105, 4);
    config.map(106, 6);
    config.map(103, 8);
    config.map(104, 9);

    const rootLayout = new Layout('');
    config.browseLayout(rootLayout);
    const subLayouts = [];
    rootLayout.addAction('-', quitAction);

    // Obs layouts
    const obsLayouts = [];
    const kingdomTwoCrowns = new Layout('Kingdom Two Crowns');
    rootLayout.addAction(0, new InternalAction(() => config.browseLayout(kingdomTwoCrowns)));
    obsLayouts.push(kingdomTwoCrowns);

    kingdomTwoCrowns.addAction(0, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Layout'}));
    kingdomTwoCrowns.addAction(1, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Arisu/Syra'}));
    kingdomTwoCrowns.addAction(2, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Arisu'}));
    kingdomTwoCrowns.addAction(3, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Syra'}));

    for (let obsLayout of obsLayouts) {
        obsLayout.addAction(7, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Start'}));
        obsLayout.addAction(8, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Pause'}));
        obsLayout.addAction(9, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'End'}));
        subLayouts.push(obsLayout);
    }

    for (let subLayout of subLayouts) {
        subLayout.addAction('backspace', new InternalAction(() => config.popLayout()));
    }

    return config;
}